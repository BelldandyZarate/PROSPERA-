<?php
// guardar_venta.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'config.php';

// Obtener datos JSON
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(["success" => false, "error" => "No se recibió JSON válido"]);
    exit;
}

if (!isset($data['cliente_id']) || empty($data['productos'])) {
    echo json_encode(["success" => false, "error" => "Faltan datos obligatorios"]);
    exit;
}

$cliente_id = (int)$data['cliente_id'];
$metodo_pago = isset($data['metodo_pago']) ? $conn->real_escape_string($data['metodo_pago']) : 'efectivo';
$estado_pago = isset($data['estado_pago']) ? $conn->real_escape_string($data['estado_pago']) : 'pagado';

// Validar que el estado de pago sea válido
$estados_validos = ['pagado', 'pendiente', 'no pagado'];
if (!in_array($estado_pago, $estados_validos)) {
    $estado_pago = 'pagado';
}

// Variables para los diferentes métodos de pago
$monto_entregado = null;
$cambio = null;
$monto_efectivo = null;
$monto_tarjeta = null;
$numero_tarjeta = null;

// Solo procesar datos de pago si el estado es "pagado"
if ($estado_pago === 'pagado') {
    if ($metodo_pago === "efectivo") {
        if (isset($data['monto_entregado'])) {
            $monto_entregado = (float)$data['monto_entregado'];
        }
        if (isset($data['cambio'])) {
            $cambio = (float)$data['cambio'];
        }
    } elseif ($metodo_pago === "tarjeta") {
        if (isset($data['numero_tarjeta'])) {
            $numero_tarjeta = $conn->real_escape_string($data['numero_tarjeta']);
        }
    } elseif ($metodo_pago === "mixto") {
        // Pago mixto: efectivo + tarjeta
        if (isset($data['monto_efectivo'])) {
            $monto_efectivo = (float)$data['monto_efectivo'];
        }
        if (isset($data['monto_tarjeta'])) {
            $monto_tarjeta = (float)$data['monto_tarjeta'];
        }
        if (isset($data['numero_tarjeta'])) {
            $numero_tarjeta = $conn->real_escape_string($data['numero_tarjeta']);
        }
        if (isset($data['cambio'])) {
            $cambio = (float)$data['cambio'];
        }
    }
}

// Iniciar transacción
$conn->begin_transaction();

try {
    // Verificar cliente
    $stmt = $conn->prepare("SELECT id, nombre_completo FROM cliente WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error verificando cliente: " . $conn->error);
    }
    
    $stmt->bind_param("i", $cliente_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        throw new Exception("El cliente con ID $cliente_id no existe");
    }
    
    $cliente = $result->fetch_assoc();
    $stmt->close();

    // GENERAR FOLIO ÚNICO PARA ESTA VENTA (GRUPO)
    $anio_actual = date('Y');
    $folio = null;
    
    // Buscar último folio del año actual
    $sql_folio = "SELECT folio FROM ventas WHERE folio LIKE ? ORDER BY id DESC LIMIT 1";
    $stmt = $conn->prepare($sql_folio);
    $busqueda_folio = "$anio_actual-%";
    $stmt->bind_param("s", $busqueda_folio);
    $stmt->execute();
    $result_folio = $stmt->get_result();
    
    if ($result_folio->num_rows > 0) {
        $ultimo_folio = $result_folio->fetch_assoc()['folio'];
        $partes = explode('-', $ultimo_folio);
        if (count($partes) == 2) {
            $ultimo_numero = (int)$partes[1];
            $nuevo_numero = str_pad($ultimo_numero + 1, 3, '0', STR_PAD_LEFT);
            $folio = "$anio_actual-$nuevo_numero";
        } else {
            $folio = "$anio_actual-001";
        }
    } else {
        $folio = "$anio_actual-001";
    }
    $stmt->close();

    $ventas_realizadas = [];
    $precio_total_venta = 0;
    
    // Procesar cada producto
    foreach ($data['productos'] as $prod) {
        if (!isset($prod['producto_id']) || !isset($prod['tipo_venta'])) {
            throw new Exception("Datos de producto incompletos");
        }

        $producto_id = (int)$prod['producto_id'];
        $tipo_venta = $prod['tipo_venta'];
        
        // Verificar producto
        $stmt = $conn->prepare("SELECT id, producto, kilos, unidades, precio_venderK, precio_venderD, activo FROM productos WHERE id = ?");
        if (!$stmt) {
            throw new Exception("Error verificando producto: " . $conn->error);
        }
        
        $stmt->bind_param("i", $producto_id);
        $stmt->execute();
        $producto_result = $stmt->get_result();
        
        if ($producto_result->num_rows === 0) {
            throw new Exception("Producto con ID $producto_id no existe");
        }
        
        $producto = $producto_result->fetch_assoc();
        $stmt->close();
        
        // Verificar si el producto está activo
        if ($producto['activo'] == 0) {
            throw new Exception("El producto '{$producto['producto']}' está SUSPENDIDO y no se puede vender");
        }
        
        $cantidad = 0;
        $precio_unitario = 0;
        
        if ($tipo_venta === 'kilos') {
            if (!isset($prod['cantidad']) || $prod['cantidad'] <= 0) {
                throw new Exception("Para '{$producto['producto']}' se requiere cantidad en kilos");
            }
            
            $cantidad = (float)$prod['cantidad'];
            
            // SOLO validar stock si el estado es "pagado"
            if ($estado_pago === 'pagado') {
                if ($producto['kilos'] <= 0) {
                    throw new Exception("El producto '{$producto['producto']}' no tiene kilos en stock");
                }
                
                if ($producto['kilos'] < $cantidad) {
                    throw new Exception("Stock insuficiente para '{$producto['producto']}'. Disponible: {$producto['kilos']} kg, Solicitado: {$cantidad} kg");
                }
            }
            
            $precio_unitario = $producto['precio_venderK'];
            
        } elseif ($tipo_venta === 'unidades') {
            if (!isset($prod['cantidad']) || $prod['cantidad'] <= 0) {
                throw new Exception("Para '{$producto['producto']}' se requiere cantidad en unidades");
            }
            
            $cantidad = (int)$prod['cantidad'];
            
            // SOLO validar stock si el estado es "pagado"
            if ($estado_pago === 'pagado') {
                if ($producto['unidades'] <= 0) {
                    throw new Exception("El producto '{$producto['producto']}' no tiene unidades en stock");
                }
                
                if ($producto['unidades'] < $cantidad) {
                    throw new Exception("Stock insuficiente para '{$producto['producto']}'. Disponible: {$producto['unidades']} unidades, Solicitado: {$cantidad} unidades");
                }
            }
            
            $precio_unitario = $producto['precio_venderD'];
        } else {
            throw new Exception("Tipo de venta desconocido");
        }
        
        $total_producto = $cantidad * $precio_unitario;
        $precio_total_venta += $total_producto;
        
        // Insertar venta con el MISMO folio para todos los productos de esta transacción
        $stmt = $conn->prepare("INSERT INTO ventas (
            folio, cliente_id, producto_id, tipo_venta, cantidad, 
            precio_unitario, total, estado_pago, metodo_pago, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $conn->error);
        }
        
        $notas = isset($prod['notas']) ? $conn->real_escape_string($prod['notas']) : NULL;
        
        $stmt->bind_param(
            "siisddssss", 
            $folio, $cliente_id, $producto_id, $tipo_venta, $cantidad, 
            $precio_unitario, $total_producto, $estado_pago, $metodo_pago, $notas
        );
        
        if (!$stmt->execute()) {
            throw new Exception("Error al guardar venta: " . $stmt->error);
        }
        
        $venta_id = $stmt->insert_id;
        $stmt->close();
        
        // SOLO restar stock si el estado es "pagado"
        if ($estado_pago === 'pagado') {
            if ($tipo_venta === 'kilos') {
                $stmt = $conn->prepare("UPDATE productos SET kilos = kilos - ? WHERE id = ?");
                $stmt->bind_param("di", $cantidad, $producto_id);
            } else {
                $stmt = $conn->prepare("UPDATE productos SET unidades = unidades - ? WHERE id = ?");
                $stmt->bind_param("ii", $cantidad, $producto_id);
            }
            
            if (!$stmt->execute()) {
                throw new Exception("Error al actualizar stock del producto: " . $stmt->error);
            }
            
            $stmt->close();
        }
        
        $ventas_realizadas[] = [
            'venta_id' => $venta_id,
            'folio' => $folio,
            'producto_id' => $producto_id,
            'producto_nombre' => $producto['producto'],
            'tipo_venta' => $tipo_venta,
            'cantidad' => $cantidad,
            'precio_unitario' => $precio_unitario,
            'total_producto' => $total_producto,
            'estado_pago' => $estado_pago,
            'stock_restante_kilos' => $estado_pago === 'pagado' ? ($tipo_venta === 'kilos' ? $producto['kilos'] - $cantidad : $producto['kilos']) : $producto['kilos'],
            'stock_restante_unidades' => $estado_pago === 'pagado' ? ($tipo_venta === 'unidades' ? $producto['unidades'] - $cantidad : $producto['unidades']) : $producto['unidades']
        ];
    }

    // Agregar notas de pago según el método y estado
    $notas_pago = "";
    
    if ($estado_pago === 'pagado') {
        if ($metodo_pago === "efectivo" && $monto_entregado !== null) {
            $notas_pago = "Pago en efectivo | Monto recibido: $" . number_format($monto_entregado, 2);
            if ($cambio !== null) {
                $notas_pago .= " | Cambio: $" . number_format($cambio, 2);
            }
        } elseif ($metodo_pago === "tarjeta" && $numero_tarjeta !== null) {
            $tarjeta_mascarada = "**** **** **** " . substr($numero_tarjeta, -4);
            $notas_pago = "Pago con tarjeta | Tarjeta: " . $tarjeta_mascarada;
        } elseif ($metodo_pago === "mixto") {
            $notas_pago = "PAGO MIXTO: ";
            if ($monto_efectivo !== null) {
                $notas_pago .= "Efectivo: $" . number_format($monto_efectivo, 2);
            }
            if ($monto_tarjeta !== null) {
                $notas_pago .= " | Tarjeta: $" . number_format($monto_tarjeta, 2);
            }
            if ($numero_tarjeta !== null) {
                $tarjeta_mascarada = "**** **** **** " . substr($numero_tarjeta, -4);
                $notas_pago .= " (" . $tarjeta_mascarada . ")";
            }
            if ($cambio !== null && $cambio > 0) {
                $notas_pago .= " | Cambio: $" . number_format($cambio, 2);
            }
        }
    } else {
        $notas_pago = "Estado de pago: " . strtoupper($estado_pago);
    }
    
    // Agregar notas a TODAS las ventas de este folio
    if (!empty($notas_pago)) {
        $stmt = $conn->prepare("UPDATE ventas SET notas = CONCAT(COALESCE(notas, ''), ' | ', ?) WHERE folio = ?");
        if ($stmt) {
            $stmt->bind_param("ss", $notas_pago, $folio);
            $stmt->execute();
            $stmt->close();
        }
    }

    $conn->commit();
    
    echo json_encode([
        "success" => true, 
        "message" => "Ventas registradas exitosamente.",
        "ventas_realizadas" => $ventas_realizadas,
        "folio" => $folio,
        "cliente_id" => $cliente_id,
        "cliente_nombre" => $cliente['nombre_completo'],
        "precio_total" => $precio_total_venta,
        "estado_pago" => $estado_pago,
        "metodo_pago" => $metodo_pago,
        "detalles_pago" => [
            "efectivo" => $monto_efectivo,
            "tarjeta" => $monto_tarjeta,
            "numero_tarjeta" => $numero_tarjeta,
            "cambio" => $cambio
        ],
        "stock_actualizado" => $estado_pago === 'pagado'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "error" => "Error al guardar la venta: " . $e->getMessage()]);
}

$conn->close();
?>