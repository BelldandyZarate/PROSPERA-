<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir configuración
include 'config.php';

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Error de conexión a la base de datos"
    ]);
    exit();
}

try {
    // Obtener todo el historial
    $sql = "SELECT 
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
            ORDER BY h.fecha_cambio DESC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta: " . $conn->error);
    }
    
    $historial = [];
    $productos_unicos = [];
    $usuarios_unicos = [];
    
    while ($row = $result->fetch_assoc()) {
        // Convertir a números
        $row['precio_anterior'] = floatval($row['precio_anterior']);
        $row['precio_nuevo'] = floatval($row['precio_nuevo']);
        $row['diferencia'] = floatval($row['diferencia']);
        $row['porcentaje_cambio'] = floatval($row['porcentaje_cambio']);
        
        // Nombre amigable del campo
        $nombres_campos = [
            'precio_kilos' => 'Precio Compra/Kg',
            'precio_venderK' => 'Precio Venta/Kg',
            'precio_unidad' => 'Precio Compra/Unid',
            'precio_venderD' => 'Precio Venta/Unid'
        ];
        
        $row['campo_nombre'] = $nombres_campos[$row['campo_cambiado']] ?? $row['campo_cambiado'];
        
        // Tipo de cambio
        if ($row['diferencia'] > 0) {
            $row['tipo_cambio'] = 'aumento';
        } elseif ($row['diferencia'] < 0) {
            $row['tipo_cambio'] = 'disminucion';
        } else {
            $row['tipo_cambio'] = 'sin_cambio';
        }
        
        $historial[] = $row;
        
        // Recolectar productos únicos
        if (!in_array($row['producto_id'], $productos_unicos)) {
            $productos_unicos[] = $row['producto_id'];
        }
        
        // Recolectar usuarios únicos
        if ($row['usuario'] && !in_array($row['usuario'], $usuarios_unicos)) {
            $usuarios_unicos[] = $row['usuario'];
        }
    }
    
    // Calcular estadísticas
    $total_cambios = count($historial);
    $productos_con_cambios = count($productos_unicos);
    $usuarios_activos = count($usuarios_unicos);
    
    // Cambios hoy
    $hoy = date('Y-m-d');
    $cambios_hoy = 0;
    foreach ($historial as $item) {
        if (substr($item['fecha_cambio'], 0, 10) === $hoy) {
            $cambios_hoy++;
        }
    }
    
    // Cambios este mes
    $mes_actual = date('Y-m');
    $cambios_este_mes = 0;
    foreach ($historial as $item) {
        if (substr($item['fecha_cambio'], 0, 7) === $mes_actual) {
            $cambios_este_mes++;
        }
    }
    
    echo json_encode([
        "success" => true,
        "data" => [
            "historial" => $historial,
            "estadisticas" => [
                "totalCambios" => $total_cambios,
                "productosConCambios" => $productos_con_cambios,
                "usuariosActivos" => $usuarios_activos,
                "cambiosHoy" => $cambios_hoy,
                "cambiosEsteMes" => $cambios_este_mes
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