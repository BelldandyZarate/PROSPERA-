<?php
// obtener_detalle_venta.php - Obtener detalle completo de una venta
require_once 'config.php';

// Verificar conexión
if (!$conn || $conn->connect_error) {
    echo json_encode([
        "success" => false, 
        "error" => "Conexión fallida",
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Obtener parámetros
$venta_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$folio = isset($_GET['folio']) ? sanitize_input($_GET['folio'], $conn) : '';

if ($venta_id <= 0 && empty($folio)) {
    echo json_encode([
        'success' => false, 
        'message' => 'Se requiere ID o Folio de la venta',
        'ejemplos' => [
            'Por ID' => 'obtener_detalle_venta.php?id=123',
            'Por Folio' => 'obtener_detalle_venta.php?folio=VEN-2024-001'
        ]
    ]);
    exit;
}

try {
    // Determinar si buscamos por ID o por Folio
    $campo_busqueda = '';
    $valor_busqueda = '';
    $tipo_busqueda = '';
    
    if (!empty($folio)) {
        $campo_busqueda = 'v.folio';
        $valor_busqueda = $folio;
        $tipo_busqueda = 'folio';
    } else {
        $campo_busqueda = 'v.id';
        $valor_busqueda = $venta_id;
        $tipo_busqueda = 'id';
    }
    
    // 1. Obtener información principal de la venta
    $sql_principal = "
        SELECT 
            v.*,
            c.nombre_completo AS cliente_nombre,
            c.telefono AS cliente_telefono,
            c.email AS cliente_email,
            c.direccion AS cliente_direccion,
            c.ciudad AS cliente_ciudad,
            c.estado AS cliente_estado,
            c.codigo_postal AS cliente_cp,
            c.rfc AS cliente_rfc,
            c.fecha_registro AS cliente_fecha_registro
        FROM ventas v 
        JOIN cliente c ON v.cliente_id = c.id 
        WHERE $campo_busqueda = ?
        ORDER BY v.fecha_venta DESC
        LIMIT 1
    ";
    
    $stmt_principal = $conn->prepare($sql_principal);
    $stmt_principal->bind_param(
        $tipo_busqueda == 'folio' ? 's' : 'i', 
        $valor_busqueda
    );
    $stmt_principal->execute();
    $result_principal = $stmt_principal->get_result();
    $venta_principal = $result_principal->fetch_assoc();
    
    if (!$venta_principal) {
        echo json_encode([
            'success' => false, 
            'message' => 'Venta no encontrada',
            'busqueda' => [
                'tipo' => $tipo_busqueda,
                'valor' => $valor_busqueda
            ]
        ]);
        exit;
    }
    
    // 2. Obtener todos los productos relacionados
    // Si tiene folio, buscar todos los productos con el mismo folio
    // Si no tiene folio, buscar solo ese producto
    $sql_productos = '';
    $productos = [];
    $total_venta = 0;
    
    if (!empty($venta_principal['folio'])) {
        // Buscar por folio (puede haber múltiples productos)
        $sql_productos = "
            SELECT 
                v.id as venta_id,
                p.id as producto_id,
                p.producto as nombre_producto,
                p.codigo_barras as producto_codigo,
                p.descripcion as producto_descripcion,
                p.categoria as producto_categoria,
                p.marca as producto_marca,
                v.cantidad,
                v.precio_unitario,
                v.total as subtotal,
                v.tipo_venta,
                v.fecha_venta,
                v.estado_pago,
                v.metodo_pago,
                v.notas as nota_venta,
                p.kilos as stock_kilos,
                p.unidades as stock_unidades,
                p.precio_venderK as precio_por_kilo,
                p.precio_venderD as precio_por_unidad,
                p.imagen as producto_imagen
            FROM ventas v
            JOIN productos p ON v.producto_id = p.id
            WHERE v.folio = ?
            ORDER BY v.id, p.producto
        ";
        
        $stmt_productos = $conn->prepare($sql_productos);
        $stmt_productos->bind_param("s", $venta_principal['folio']);
        $stmt_productos->execute();
        $result_productos = $stmt_productos->get_result();
        
        while($row = $result_productos->fetch_assoc()) {
            // Formatear datos
            $row['unidad_medida'] = $row['tipo_venta'] == 'kilos' ? 'kg' : 'unid';
            $row['tipo_venta_texto'] = $row['tipo_venta'] == 'kilos' ? 'Por Kilos' : 'Por Unidades';
            $row['cantidad_formateada'] = number_format($row['cantidad'], 2);
            $row['precio_unitario_formateado'] = '$' . number_format($row['precio_unitario'], 2);
            $row['subtotal_formateado'] = '$' . number_format($row['subtotal'], 2);
            $row['fecha_venta_formateada'] = date('d/m/Y H:i', strtotime($row['fecha_venta']));
            
            // Calcular descuento si existe
            $precio_calculado = $row['cantidad'] * $row['precio_unitario'];
            $row['descuento'] = $precio_calculado - $row['subtotal'];
            $row['descuento_formateado'] = '$' . number_format($row['descuento'], 2);
            $row['porcentaje_descuento'] = $row['descuento'] > 0 ? 
                round(($row['descuento'] / $precio_calculado) * 100, 2) : 0;
            
            $productos[] = $row;
            $total_venta += floatval($row['subtotal']);
        }
        
        $stmt_productos->close();
    } else {
        // Buscar solo este producto (venta sin folio)
        $sql_productos = "
            SELECT 
                v.id as venta_id,
                p.id as producto_id,
                p.producto as nombre_producto,
                p.codigo_barras as producto_codigo,
                p.descripcion as producto_descripcion,
                p.categoria as producto_categoria,
                p.marca as producto_marca,
                v.cantidad,
                v.precio_unitario,
                v.total as subtotal,
                v.tipo_venta,
                v.fecha_venta,
                v.estado_pago,
                v.metodo_pago,
                v.notas as nota_venta,
                p.kilos as stock_kilos,
                p.unidades as stock_unidades,
                p.precio_venderK as precio_por_kilo,
                p.precio_venderD as precio_por_unidad,
                p.imagen as producto_imagen
            FROM ventas v
            JOIN productos p ON v.producto_id = p.id
            WHERE v.id = ?
        ";
        
        $stmt_productos = $conn->prepare($sql_productos);
        $stmt_productos->bind_param("i", $venta_principal['id']);
        $stmt_productos->execute();
        $result_productos = $stmt_productos->get_result();
        
        if($row = $result_productos->fetch_assoc()) {
            // Formatear datos
            $row['unidad_medida'] = $row['tipo_venta'] == 'kilos' ? 'kg' : 'unid';
            $row['tipo_venta_texto'] = $row['tipo_venta'] == 'kilos' ? 'Por Kilos' : 'Por Unidades';
            $row['cantidad_formateada'] = number_format($row['cantidad'], 2);
            $row['precio_unitario_formateado'] = '$' . number_format($row['precio_unitario'], 2);
            $row['subtotal_formateado'] = '$' . number_format($row['subtotal'], 2);
            $row['fecha_venta_formateada'] = date('d/m/Y H:i', strtotime($row['fecha_venta']));
            
            // Calcular descuento
            $precio_calculado = $row['cantidad'] * $row['precio_unitario'];
            $row['descuento'] = $precio_calculado - $row['subtotal'];
            $row['descuento_formateado'] = '$' . number_format($row['descuento'], 2);
            $row['porcentaje_descuento'] = $row['descuento'] > 0 ? 
                round(($row['descuento'] / $precio_calculado) * 100, 2) : 0;
            
            $productos[] = $row;
            $total_venta = floatval($row['subtotal']);
        }
        
        $stmt_productos->close();
    }
    
    // 3. Obtener historial de pagos si existe tabla pagos
    $historial_pagos = [];
    $check_pagos = $conn->query("SHOW TABLES LIKE 'pagos'");
    if ($check_pagos && $check_pagos->num_rows > 0) {
        if (!empty($venta_principal['folio'])) {
            $sql_pagos = "SELECT * FROM pagos WHERE folio_venta = ? ORDER BY fecha_pago DESC";
            $stmt_pagos = $conn->prepare($sql_pagos);
            $stmt_pagos->bind_param("s", $venta_principal['folio']);
        } else {
            $sql_pagos = "SELECT * FROM pagos WHERE venta_id = ? ORDER BY fecha_pago DESC";
            $stmt_pagos = $conn->prepare($sql_pagos);
            $stmt_pagos->bind_param("i", $venta_principal['id']);
        }
        
        $stmt_pagos->execute();
        $result_pagos = $stmt_pagos->get_result();
        
        while($pago = $result_pagos->fetch_assoc()) {
            $pago['fecha_pago_formateada'] = date('d/m/Y H:i', strtotime($pago['fecha_pago']));
            $pago['monto_formateado'] = '$' . number_format($pago['monto'], 2);
            $historial_pagos[] = $pago;
        }
        
        $stmt_pagos->close();
    }
    
    // 4. Preparar datos del cliente
    $cliente_info = [
        'id' => $venta_principal['cliente_id'],
        'nombre' => $venta_principal['cliente_nombre'],
        'telefono' => $venta_principal['cliente_telefono'],
        'email' => $venta_principal['cliente_email'],
        'direccion' => $venta_principal['cliente_direccion'],
        'ciudad' => $venta_principal['cliente_ciudad'],
        'estado' => $venta_principal['cliente_estado'],
        'codigo_postal' => $venta_principal['cliente_cp'],
        'rfc' => $venta_principal['cliente_rfc'],
        'fecha_registro' => $venta_principal['cliente_fecha_registro'],
        'fecha_registro_formateada' => !empty($venta_principal['cliente_fecha_registro']) ? 
            date('d/m/Y', strtotime($venta_principal['cliente_fecha_registro'])) : ''
    ];
    
    // 5. Calcular saldo pendiente
    $saldo_pendiente = 0;
    $total_pagado = 0;
    
    if ($venta_principal['estado_pago'] == 'pendiente') {
        $saldo_pendiente = $total_venta - array_sum(array_column($historial_pagos, 'monto'));
        $total_pagado = array_sum(array_column($historial_pagos, 'monto'));
    }
    
    // 6. Preparar respuesta completa
    $response = [
        'success' => true,
        'data' => [
            'venta' => [
                'id' => $venta_principal['id'],
                'folio' => $venta_principal['folio'] ?? null,
                'cliente' => $cliente_info,
                'metodo_pago' => $venta_principal['metodo_pago'],
                'estado_pago' => $venta_principal['estado_pago'],
                'estado_pago_texto' => ucfirst($venta_principal['estado_pago']),
                'total' => $total_venta,
                'total_formateado' => '$' . number_format($total_venta, 2),
                'saldo_pendiente' => $saldo_pendiente,
                'saldo_pendiente_formateado' => '$' . number_format($saldo_pendiente, 2),
                'total_pagado' => $total_pagado,
                'total_pagado_formateado' => '$' . number_format($total_pagado, 2),
                'fecha_venta' => $venta_principal['fecha_venta'],
                'fecha_venta_formateada' => date('d/m/Y H:i', strtotime($venta_principal['fecha_venta'])),
                'fecha_venta_corta' => date('d/m/Y', strtotime($venta_principal['fecha_venta'])),
                'hora_venta' => date('H:i', strtotime($venta_principal['fecha_venta'])),
                'notas' => $venta_principal['notas'],
                'vendedor_id' => $venta_principal['vendedor_id'] ?? null,
                'sucursal_id' => $venta_principal['sucursal_id'] ?? null
            ],
            'productos' => $productos,
            'historial_pagos' => $historial_pagos,
            'resumen' => [
                'total_productos' => count($productos),
                'total_kilos' => array_sum(array_map(function($p) {
                    return $p['tipo_venta'] == 'kilos' ? $p['cantidad'] : 0;
                }, $productos)),
                'total_unidades' => array_sum(array_map(function($p) {
                    return $p['tipo_venta'] == 'unidades' ? $p['cantidad'] : 0;
                }, $productos)),
                'descuento_total' => array_sum(array_column($productos, 'descuento')),
                'descuento_total_formateado' => '$' . number_format(
                    array_sum(array_column($productos, 'descuento')), 2
                )
            ]
        ],
        'metadata' => [
            'tipo_busqueda' => $tipo_busqueda,
            'valor_buscado' => $valor_busqueda,
            'timestamp' => date('Y-m-d H:i:s'),
            'version' => '1.0'
        ]
    ];

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Error en la base de datos: ' . $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}

// Cerrar conexiones
if (isset($stmt_principal)) $stmt_principal->close();
if (isset($stmt_productos)) $stmt_productos->close();
$conn->close();
?>