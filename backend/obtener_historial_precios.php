<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Habilitar reporte de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Manejar solicitud preflight OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir configuración de la base de datos
include 'config.php';

// Verificar conexión a la base de datos
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Error de conexión a la base de datos"
    ]);
    exit();
}

// Obtener ID del producto
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode([
        "success" => false,
        "error" => "Se requiere el ID del producto"
    ]);
    exit();
}

$producto_id = intval($_GET['id']);

if ($producto_id <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "ID de producto inválido"
    ]);
    exit();
}

try {
    // 1. Obtener información del producto
    $sql_producto = "SELECT 
                        p.id,
                        p.producto,
                        p.tipo_producto,
                        p.kilos,
                        p.precio_kilos,
                        p.precio_venderK,
                        p.unidades,
                        p.precio_unidad,
                        p.precio_venderD,
                        p.fecha_recibimiento,
                        p.fecha_creacion,
                        p.fecha_actualizacion,
                        p.usuario_modificacion
                    FROM productos p 
                    WHERE p.id = ?";
    
    $stmt_producto = $conn->prepare($sql_producto);
    
    if (!$stmt_producto) {
        throw new Exception("Error preparando consulta de producto: " . $conn->error);
    }
    
    $stmt_producto->bind_param("i", $producto_id);
    $stmt_producto->execute();
    $result_producto = $stmt_producto->get_result();
    
    if ($result_producto->num_rows == 0) {
        $stmt_producto->close();
        echo json_encode([
            "success" => false,
            "error" => "Producto no encontrado con ID: " . $producto_id
        ]);
        exit();
    }
    
    $producto = $result_producto->fetch_assoc();
    $stmt_producto->close();
    
    // 2. Obtener historial de precios
    $sql_historial = "SELECT 
                        h.id,
                        h.producto_id,
                        h.producto_nombre,
                        h.campo_cambiado,
                        h.precio_anterior,
                        h.precio_nuevo,
                        h.diferencia,
                        h.porcentaje_cambio,
                        DATE_FORMAT(h.fecha_cambio, '%Y-%m-%d %H:%i:%s') as fecha_cambio,
                        h.usuario,
                        h.motivo
                    FROM historial_precios h
                    WHERE h.producto_id = ?
                    ORDER BY h.fecha_cambio DESC";
    
    $stmt_historial = $conn->prepare($sql_historial);
    
    if (!$stmt_historial) {
        throw new Exception("Error preparando consulta de historial: " . $conn->error);
    }
    
    $stmt_historial->bind_param("i", $producto_id);
    $stmt_historial->execute();
    $result_historial = $stmt_historial->get_result();
    
    $historial = [];
    $usuarios_unicos = [];
    $campos_unicos = [];
    
    while ($row = $result_historial->fetch_assoc()) {
        // Convertir a números flotantes
        $row['precio_anterior'] = floatval($row['precio_anterior']);
        $row['precio_nuevo'] = floatval($row['precio_nuevo']);
        $row['diferencia'] = floatval($row['diferencia']);
        $row['porcentaje_cambio'] = floatval($row['porcentaje_cambio']);
        
        // Agregar nombre amigable del campo
        $nombres_campos = [
            'precio_kilos' => 'Precio Compra por Kilo',
            'precio_venderK' => 'Precio Venta por Kilo',
            'precio_unidad' => 'Precio Compra por Unidad',
            'precio_venderD' => 'Precio Venta por Unidad'
        ];
        
        $row['campo_nombre'] = $nombres_campos[$row['campo_cambiado']] ?? $row['campo_cambiado'];
        
        // Determinar tipo de cambio
        if ($row['diferencia'] > 0) {
            $row['tipo_cambio'] = 'aumento';
        } elseif ($row['diferencia'] < 0) {
            $row['tipo_cambio'] = 'disminucion';
        } else {
            $row['tipo_cambio'] = 'sin_cambio';
        }
        
        $historial[] = $row;
        
        // Recolectar usuarios únicos
        if ($row['usuario'] && !in_array($row['usuario'], $usuarios_unicos)) {
            $usuarios_unicos[] = $row['usuario'];
        }
        
        // Recolectar campos únicos
        if ($row['campo_cambiado'] && !in_array($row['campo_cambiado'], $campos_unicos)) {
            $campos_unicos[] = $row['campo_cambiado'];
        }
    }
    
    $stmt_historial->close();
    
    // 3. Calcular estadísticas
    $total_cambios = count($historial);
    $primer_cambio = $total_cambios > 0 ? $historial[$total_cambios - 1]['fecha_cambio'] : null;
    $ultimo_cambio = $total_cambios > 0 ? $historial[0]['fecha_cambio'] : null;
    
    // Calcular cambios por campo
    $cambios_por_campo = [];
    foreach ($historial as $item) {
        $campo = $item['campo_cambiado'];
        if (!isset($cambios_por_campo[$campo])) {
            $cambios_por_campo[$campo] = 0;
        }
        $cambios_por_campo[$campo]++;
    }
    
    // Calcular cambios por mes
    $cambios_por_mes = [];
    foreach ($historial as $item) {
        $fecha = new DateTime($item['fecha_cambio']);
        $mes_año = $fecha->format('Y-m');
        if (!isset($cambios_por_mes[$mes_año])) {
            $cambios_por_mes[$mes_año] = 0;
        }
        $cambios_por_mes[$mes_año]++;
    }
    
    // Determinar precio actual del producto
    $precio_actual = 0;
    if ($producto['tipo_producto'] === 'verduras_frutas') {
        $precio_actual = floatval($producto['precio_venderK']);
    } else {
        $precio_actual = floatval($producto['precio_venderD']);
    }
    
    // Calcular precio inicial (del primer cambio registrado)
    $precio_inicial = 0;
    if ($total_cambios > 0) {
        $primer_registro = $historial[$total_cambios - 1];
        $precio_inicial = $primer_registro['precio_anterior'];
    }
    
    echo json_encode([
        "success" => true,
        "data" => [
            "producto" => $producto,
            "historial" => $historial,
            "estadisticas" => [
                "total_cambios" => $total_cambios,
                "primer_cambio" => $primer_cambio,
                "ultimo_cambio" => $ultimo_cambio,
                "cambios_por_campo" => $cambios_por_campo,
                "cambios_por_mes" => $cambios_por_mes,
                "usuarios" => $usuarios_unicos,
                "campos" => $campos_unicos,
                "precio_actual" => $precio_actual,
                "precio_inicial" => $precio_inicial
            ]
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "error" => "Error en el servidor: " . $e->getMessage()
    ]);
}

$conn->close();
?>