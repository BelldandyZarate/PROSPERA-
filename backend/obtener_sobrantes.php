<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Incluir configuración de la base de datos
include 'config.php';

try {
    // Parámetros de filtro por estado
    $estado = isset($_GET['estado']) ? $_GET['estado'] : 'pendiente';
    $mostrar_todos = isset($_GET['mostrar_todos']) && $_GET['mostrar_todos'] == 'true';
    $tipo_producto = isset($_GET['tipo_producto']) ? $_GET['tipo_producto'] : '';
    
    // Parámetros de fecha
    $fecha_desde = isset($_GET['fecha_desde']) ? $_GET['fecha_desde'] : '';
    $fecha_hasta = isset($_GET['fecha_hasta']) ? $_GET['fecha_hasta'] : '';
    
    // Parámetros de paginación
    $pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
    $por_pagina = isset($_GET['por_pagina']) ? intval($_GET['por_pagina']) : 20;
    $offset = ($pagina - 1) * $por_pagina;
    
    // Construir condiciones WHERE
    $where_conditions = [];
    $params = [];
    $types = '';
    
    if (!$mostrar_todos && $estado) {
        $where_conditions[] = "s.estado = ?";
        $params[] = $estado;
        $types .= 's';
    }
    
    if ($tipo_producto && in_array($tipo_producto, ['verduras_frutas', 'otro'])) {
        $where_conditions[] = "s.tipo_producto = ?";
        $params[] = $tipo_producto;
        $types .= 's';
    }
    
    if ($fecha_desde) {
        $where_conditions[] = "DATE(s.fecha_sobrante) >= ?";
        $params[] = $fecha_desde;
        $types .= 's';
    }
    
    if ($fecha_hasta) {
        $where_conditions[] = "DATE(s.fecha_sobrante) <= ?";
        $params[] = $fecha_hasta;
        $types .= 's';
    }
    
    $where_sql = "";
    if (!empty($where_conditions)) {
        $where_sql = " WHERE " . implode(" AND ", $where_conditions);
    }
    
    // Consulta para contar total de filas según filtro
    $sql_count = "SELECT COUNT(*) as total FROM sobrantes s" . $where_sql;
    $stmt_count = $conn->prepare($sql_count);
    
    // Asignar parámetros para count si existen
    if (!empty($params)) {
        $stmt_count->bind_param($types, ...$params);
    }
    
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $count_data = $result_count->fetch_assoc();
    $total_filas = $count_data['total'] ?? 0;
    $total_paginas = $por_pagina > 0 ? ceil($total_filas / $por_pagina) : 1;
    
    // Obtener estadísticas generales
    $estadisticas = [
        'total_sobrantes' => 0,
        'pendientes' => 0,
        'procesados' => 0,
        'descartados' => 0,
        'valor_total_pendientes' => 0,
        'valor_total_procesados' => 0,
        'valor_total_descartados' => 0,
        'kilos_totales' => 0,
        'unidades_totales' => 0
    ];
    
    // Consulta para estadísticas generales
    $sql_stats = "SELECT 
        COUNT(*) as total_sobrantes,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'procesado' THEN 1 ELSE 0 END) as procesados,
        SUM(CASE WHEN estado = 'descartado' THEN 1 ELSE 0 END) as descartados,
        SUM(CASE WHEN estado = 'pendiente' THEN valor_total ELSE 0 END) as valor_pendientes,
        SUM(CASE WHEN estado = 'procesado' THEN valor_total ELSE 0 END) as valor_procesados,
        SUM(CASE WHEN estado = 'descartado' THEN valor_total ELSE 0 END) as valor_descartados,
        SUM(kilos) as kilos_totales,
        SUM(unidades) as unidades_totales
    FROM sobrantes";
    
    $result_stats = $conn->query($sql_stats);
    if ($result_stats) {
        $stats_data = $result_stats->fetch_assoc();
        if ($stats_data) {
            $estadisticas['total_sobrantes'] = intval($stats_data['total_sobrantes'] ?? 0);
            $estadisticas['pendientes'] = intval($stats_data['pendientes'] ?? 0);
            $estadisticas['procesados'] = intval($stats_data['procesados'] ?? 0);
            $estadisticas['descartados'] = intval($stats_data['descartados'] ?? 0);
            $estadisticas['valor_total_pendientes'] = floatval($stats_data['valor_pendientes'] ?? 0);
            $estadisticas['valor_total_procesados'] = floatval($stats_data['valor_procesados'] ?? 0);
            $estadisticas['valor_total_descartados'] = floatval($stats_data['valor_descartados'] ?? 0);
            $estadisticas['kilos_totales'] = floatval($stats_data['kilos_totales'] ?? 0);
            $estadisticas['unidades_totales'] = intval($stats_data['unidades_totales'] ?? 0);
        }
    }
    
    // Consulta principal con paginación
    $sql = "SELECT 
        s.*,
        u.nombre as usuario_nombre,
        p.producto as producto_original_nombre
    FROM sobrantes s
    LEFT JOIN usuarios u ON s.usuario_id = u.id
    LEFT JOIN productos p ON s.producto_id = p.id
    " . $where_sql . "
    ORDER BY 
        CASE 
            WHEN s.estado = 'pendiente' THEN 1
            WHEN s.estado = 'procesado' THEN 2
            WHEN s.estado = 'descartado' THEN 3
        END,
        s.fecha_sobrante DESC
    LIMIT ?, ?";
    
    $stmt = $conn->prepare($sql);
    
    // Agregar parámetros de paginación a los parámetros existentes
    $params_with_pagination = $params;
    $params_with_pagination[] = $offset;
    $params_with_pagination[] = $por_pagina;
    $types_with_pagination = $types . 'ii';
    
    // Asignar parámetros si existen
    if (!empty($params)) {
        $stmt->bind_param($types_with_pagination, ...$params_with_pagination);
    } else {
        // Si no hay otros parámetros, solo bind de paginación
        $stmt->bind_param('ii', $offset, $por_pagina);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $sobrantes = [];
    
    while ($row = $result->fetch_assoc()) {
        // Calcular campos adicionales
        $row['dias_en_inventario'] = intval($row['dias_en_inventario'] ?? 0);
        $row['kilos'] = floatval($row['kilos'] ?? 0);
        $row['unidades'] = intval($row['unidades'] ?? 0);
        $row['precio_kilos'] = floatval($row['precio_kilos'] ?? 0);
        $row['precio_unidad'] = floatval($row['precio_unidad'] ?? 0);
        $row['valor_total'] = floatval($row['valor_total'] ?? 0);
        
        // Agregar campo calculado para el valor unitario promedio
        if ($row['kilos'] > 0) {
            $row['valor_por_kilo'] = round($row['valor_total'] / $row['kilos'], 2);
        } else {
            $row['valor_por_kilo'] = 0;
        }
        
        if ($row['unidades'] > 0) {
            $row['valor_por_unidad'] = round($row['valor_total'] / $row['unidades'], 2);
        } else {
            $row['valor_por_unidad'] = 0;
        }
        
        // Formatear fechas para mostrar en frontend
        if ($row['fecha_sobrante']) {
            $fecha = new DateTime($row['fecha_sobrante']);
            $row['fecha_sobrante_formateada'] = $fecha->format('d/m/Y H:i');
        }
        
        if ($row['fecha_procesado']) {
            $fecha = new DateTime($row['fecha_procesado']);
            $row['fecha_procesado_formateada'] = $fecha->format('d/m/Y H:i');
        }
        
        if ($row['fecha_recibimiento']) {
            $fecha = new DateTime($row['fecha_recibimiento']);
            $row['fecha_recibimiento_formateada'] = $fecha->format('d/m/Y');
        }
        
        $sobrantes[] = $row;
    }
    
    $response = [
        "success" => true,
        "data" => $sobrantes,
        "estadisticas" => $estadisticas,
        "paginacion" => [
            "pagina_actual" => $pagina,
            "por_pagina" => $por_pagina,
            "total_filas" => $total_filas,
            "total_paginas" => $total_paginas
        ],
        "filtros" => [
            "estado" => $estado,
            "mostrar_todos" => $mostrar_todos,
            "tipo_producto" => $tipo_producto,
            "fecha_desde" => $fecha_desde,
            "fecha_hasta" => $fecha_hasta
        ],
        "total" => count($sobrantes)
    ];
    
    echo json_encode($response);
    
    // Cerrar statements
    if (isset($stmt_count)) $stmt_count->close();
    if (isset($stmt)) $stmt->close();
    if (isset($result_stats)) $result_stats->free();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error en el servidor: " . $e->getMessage()
    ]);
}

$conn->close();
?>