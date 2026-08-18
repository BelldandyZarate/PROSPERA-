<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Incluir configuración de la base de datos
include 'config.php';

try {
    // Parámetros de filtro por estado activo
    $solo_inactivos = isset($_GET['solo_inactivos']) && $_GET['solo_inactivos'] == 'true';
    $mostrar_todos = isset($_GET['mostrar_todos']) && $_GET['mostrar_todos'] == 'true';
    $solo_activos = isset($_GET['solo_activos']) && $_GET['solo_activos'] == 'true';
    
    // Parámetros de paginación
    $pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
    $por_pagina = isset($_GET['por_pagina']) ? intval($_GET['por_pagina']) : 20;
    $offset = ($pagina - 1) * $por_pagina;
    
    // Construir condiciones WHERE según filtro
    $where_conditions = [];
    
    if ($solo_inactivos) {
        $where_conditions[] = "activo = 0";
    } elseif ($solo_activos) {
        $where_conditions[] = "activo = 1";
    } elseif (!$mostrar_todos) {
        // Por defecto, mostrar solo productos activos
        $where_conditions[] = "activo = 1";
    }
    
    $where_sql = "";
    if (!empty($where_conditions)) {
        $where_sql = " WHERE " . implode(" AND ", $where_conditions);
    }
    
    // Consulta para contar total de filas según filtro
    $sql_count = "SELECT COUNT(*) as total FROM productos" . $where_sql;
    $result_count = $conn->query($sql_count);
    
    if (!$result_count) {
        throw new Exception("Error en consulta count: " . $conn->error);
    }
    
    $count_data = $result_count->fetch_assoc();
    $total_filas = $count_data['total'] ?? 0;
    $total_paginas = $por_pagina > 0 ? ceil($total_filas / $por_pagina) : 1;
    
    // Obtener estadísticas generales
    $estadisticas = [
        'total_productos' => 0,
        'activos' => 0,
        'inactivos' => 0,
        'ganancia_total_estimada' => 0,
        'costo_total_general' => 0,
        'venta_total_general' => 0
    ];
    
    // Consulta para estadísticas
    $sql_stats = "SELECT 
        COUNT(*) as total_productos,
        SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) as inactivos,
        SUM(CASE WHEN kilos > 0 AND precio_kilos > 0 AND activo = 1 THEN kilos * precio_kilos ELSE 0 END) as costo_verduras,
        SUM(CASE WHEN unidades > 0 AND precio_unidad > 0 AND activo = 1 THEN unidades * precio_unidad ELSE 0 END) as costo_otros,
        SUM(CASE WHEN kilos > 0 AND precio_venderK > 0 AND activo = 1 THEN kilos * precio_venderK ELSE 0 END) as venta_verduras,
        SUM(CASE WHEN unidades > 0 AND precio_venderD > 0 AND activo = 1 THEN unidades * precio_venderD ELSE 0 END) as venta_otros
    FROM productos";
    
    $result_stats = $conn->query($sql_stats);
    if ($result_stats) {
        $stats_data = $result_stats->fetch_assoc();
        if ($stats_data) {
            $estadisticas['total_productos'] = intval($stats_data['total_productos'] ?? 0);
            $estadisticas['activos'] = intval($stats_data['activos'] ?? 0);
            $estadisticas['inactivos'] = intval($stats_data['inactivos'] ?? 0);
            $estadisticas['costo_total_general'] = floatval($stats_data['costo_verduras'] ?? 0) + floatval($stats_data['costo_otros'] ?? 0);
            $estadisticas['venta_total_general'] = floatval($stats_data['venta_verduras'] ?? 0) + floatval($stats_data['venta_otros'] ?? 0);
            $estadisticas['ganancia_total_estimada'] = $estadisticas['venta_total_general'] - $estadisticas['costo_total_general'];
        }
    }
    
    // Consulta principal con paginación - INCLUYENDO OBSERVACIONES
    $sql = "SELECT 
                id, 
                producto, 
                kilos, 
                precio_kilos, 
                precio_venderK, 
                unidades, 
                precio_unidad, 
                precio_venderD, 
                fecha_recibimiento,
                fecha_creacion,
                fecha_actualizacion,
                usuario_modificacion,
                estado,
                activo,
                observaciones  -- NUEVO CAMPO AGREGADO
            FROM productos 
            " . $where_sql . "
            ORDER BY activo DESC, fecha_actualizacion DESC, id DESC
            LIMIT $offset, $por_pagina";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Error en consulta principal: " . $conn->error);
    }
    
    $productos = array();
    
    while ($row = $result->fetch_assoc()) {
        // Calcular valores solo si está activo
        $costo_total = 0;
        $venta_total = 0;
        
        if ($row['activo'] == 1) {
            if ($row['kilos'] > 0 && $row['precio_kilos'] > 0) {
                $costo_total = $row['kilos'] * $row['precio_kilos'];
                $venta_total = $row['kilos'] * $row['precio_venderK'];
            } elseif ($row['unidades'] > 0 && $row['precio_unidad'] > 0) {
                $costo_total = $row['unidades'] * $row['precio_unidad'];
                $venta_total = $row['unidades'] * $row['precio_venderD'];
            }
        }
        
        // Agregar campos calculados
        $row['costo_total'] = round($costo_total, 2);
        $row['venta_total'] = round($venta_total, 2);
        $row['ganancia'] = round($venta_total - $costo_total, 2);
        
        // Asegurar tipos de datos
        $row['kilos'] = floatval($row['kilos'] ?? 0);
        $row['precio_kilos'] = floatval($row['precio_kilos'] ?? 0);
        $row['precio_venderK'] = floatval($row['precio_venderK'] ?? 0);
        $row['unidades'] = intval($row['unidades'] ?? 0);
        $row['precio_unidad'] = floatval($row['precio_unidad'] ?? 0);
        $row['precio_venderD'] = floatval($row['precio_venderD'] ?? 0);
        $row['activo'] = intval($row['activo'] ?? 1);
        $row['observaciones'] = $row['observaciones'] ?? ''; // Asegurar que exista el campo
        
        $productos[] = $row;
    }
    
    $response = [
        "success" => true,
        "data" => $productos,
        "estadisticas" => $estadisticas,
        "paginacion" => [
            "pagina_actual" => $pagina,
            "por_pagina" => $por_pagina,
            "total_filas" => $total_filas,
            "total_paginas" => $total_paginas
        ],
        "filtros" => [
            "solo_inactivos" => $solo_inactivos,
            "mostrar_todos" => $mostrar_todos,
            "solo_activos" => $solo_activos
        ],
        "total" => count($productos)
    ];
    
    echo json_encode($response);
    
    if ($result) $result->close();
    if ($result_count) $result_count->close();
    if ($result_stats) $result_stats->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error en el servidor: " . $e->getMessage()
    ]);
}

$conn->close();
?>