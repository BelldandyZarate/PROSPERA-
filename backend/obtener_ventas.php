<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Incluir configuración de la base de datos
include 'config.php';

try {
    // Parámetros de filtrado
    $folio = isset($_GET['folio']) ? $conn->real_escape_string($_GET['folio']) : '';
    $cliente_id = isset($_GET['cliente_id']) ? intval($_GET['cliente_id']) : 0;
    $producto_id = isset($_GET['producto_id']) ? intval($_GET['producto_id']) : 0;
    $fecha_inicio = isset($_GET['fecha_inicio']) ? $conn->real_escape_string($_GET['fecha_inicio']) : '';
    $fecha_fin = isset($_GET['fecha_fin']) ? $conn->real_escape_string($_GET['fecha_fin']) : '';
    $estado_pago = isset($_GET['estado_pago']) ? $conn->real_escape_string($_GET['estado_pago']) : '';
    $metodo_pago = isset($_GET['metodo_pago']) ? $conn->real_escape_string($_GET['metodo_pago']) : '';
    $tipo_venta = isset($_GET['tipo_venta']) ? $conn->real_escape_string($_GET['tipo_venta']) : '';
    
    // Paginación
    $pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;
    $por_pagina = isset($_GET['por_pagina']) ? intval($_GET['por_pagina']) : 20;
    $offset = ($pagina - 1) * $por_pagina;
    
    // Construir consulta base con JOINs usando tus tablas
    $sql_base = "SELECT 
                    v.id AS venta_id,
                    v.folio,
                    v.cliente_id,
                    c.nombre_completo AS cliente,
                    c.telefono AS cliente_telefono,
                    c.correo AS cliente_correo,
                    v.producto_id,
                    p.producto AS nombre_producto,
                    v.tipo_venta,
                    v.cantidad,
                    v.precio_unitario,
                    v.total AS precio_total,
                    v.estado_pago,
                    v.metodo_pago,
                    v.fecha_venta,
                    v.notas
                FROM ventas v
                LEFT JOIN cliente c ON v.cliente_id = c.id
                LEFT JOIN productos p ON v.producto_id = p.id
                WHERE 1=1";
    
    $sql_conditions = "";
    $params = array();
    
    // Aplicar filtros
    if (!empty($folio)) {
        $sql_conditions .= " AND v.folio LIKE ?";
        $params[] = "%$folio%";
    }
    
    if ($cliente_id > 0) {
        $sql_conditions .= " AND v.cliente_id = ?";
        $params[] = $cliente_id;
    }
    
    if ($producto_id > 0) {
        $sql_conditions .= " AND v.producto_id = ?";
        $params[] = $producto_id;
    }
    
    if (!empty($fecha_inicio)) {
        $sql_conditions .= " AND DATE(v.fecha_venta) >= ?";
        $params[] = $fecha_inicio;
    }
    
    if (!empty($fecha_fin)) {
        $sql_conditions .= " AND DATE(v.fecha_venta) <= ?";
        $params[] = $fecha_fin;
    }
    
    if (!empty($estado_pago)) {
        $sql_conditions .= " AND v.estado_pago = ?";
        $params[] = $estado_pago;
    }
    
    if (!empty($metodo_pago)) {
        $sql_conditions .= " AND v.metodo_pago = ?";
        $params[] = $metodo_pago;
    }
    
    if (!empty($tipo_venta)) {
        $sql_conditions .= " AND v.tipo_venta = ?";
        $params[] = $tipo_venta;
    }
    
    $sql_full = $sql_base . $sql_conditions . " ORDER BY v.fecha_venta DESC";
    
    // Contar total de registros
    $sql_count = "SELECT COUNT(*) as total FROM ventas v WHERE 1=1" . $sql_conditions;
    
    // Preparar y ejecutar conteo
    $stmt_count = $conn->prepare($sql_count);
    if (!empty($params)) {
        $types = str_repeat('s', count($params));
        $stmt_count->bind_param($types, ...$params);
    }
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $total_data = $result_count->fetch_assoc();
    $total_filas = $total_data['total'];
    $total_paginas = ceil($total_filas / $por_pagina);
    $stmt_count->close();
    
    // Aplicar paginación
    $sql_paginated = $sql_full . " LIMIT ?, ?";
    $params_paginated = array_merge($params, [$offset, $por_pagina]);
    
    // Preparar y ejecutar consulta principal
    $stmt = $conn->prepare($sql_paginated);
    if (!empty($params_paginated)) {
        $types_paginated = (!empty($params) ? str_repeat('s', count($params)) : '') . 'ii';
        $stmt->bind_param($types_paginated, ...$params_paginated);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $ventas = array();
    $ventas_agrupadas = array();
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            // Formatear valores
            $row['cantidad'] = floatval($row['cantidad']);
            $row['precio_unitario'] = floatval($row['precio_unitario']);
            $row['precio_total'] = floatval($row['precio_total']);
            $row['fecha_venta_formateada'] = date('d/m/Y H:i', strtotime($row['fecha_venta']));
            $row['unidad_medida'] = $row['tipo_venta'] === 'kilos' ? 'kg' : 'unid';
            
            $ventas[] = $row;
            
            // Agrupar por folio (usar venta_id si no hay folio)
            $folio_key = !empty($row['folio']) ? $row['folio'] : 'VENTA-' . $row['venta_id'];
            
            if (!isset($ventas_agrupadas[$folio_key])) {
                $ventas_agrupadas[$folio_key] = [
                    'id' => $row['venta_id'],
                    'folio' => $row['folio'] ?: 'VENTA-' . $row['venta_id'],
                    'cliente_id' => $row['cliente_id'],
                    'cliente' => $row['cliente'] ?: 'Cliente no encontrado',
                    'cliente_telefono' => $row['cliente_telefono'] ?: '',
                    'cliente_correo' => $row['cliente_correo'] ?: '',
                    'fecha_venta' => $row['fecha_venta'],
                    'fecha_venta_formateada' => $row['fecha_venta_formateada'],
                    'estado_pago' => $row['estado_pago'] ?: 'pagado',
                    'metodo_pago' => $row['metodo_pago'] ?: 'efectivo',
                    'notas' => $row['notas'] ?: '',
                    'total_venta' => 0,
                    'total_productos' => 0,
                    'detalles' => []
                ];
            }
            
            // Agregar producto a los detalles
            $ventas_agrupadas[$folio_key]['detalles'][] = [
                'venta_id' => $row['venta_id'],
                'producto_id' => $row['producto_id'],
                'nombre_producto' => $row['nombre_producto'] ?: 'Producto no encontrado',
                'tipo_venta' => $row['tipo_venta'],
                'cantidad' => $row['cantidad'],
                'precio_unitario' => $row['precio_unitario'],
                'precio_total' => $row['precio_total'],
                'unidad_medida' => $row['unidad_medida']
            ];
            
            // Actualizar totales
            $ventas_agrupadas[$folio_key]['total_venta'] += $row['precio_total'];
            $ventas_agrupadas[$folio_key]['total_productos']++;
        }
        
        // Estadísticas
        $sql_stats = "SELECT 
                        COUNT(DISTINCT IF(folio != '' AND folio IS NOT NULL, folio, id)) as total_ventas,
                        COUNT(*) as total_items,
                        SUM(total) as importe_total,
                        SUM(CASE WHEN estado_pago = 'pagado' THEN total ELSE 0 END) as importe_pagado,
                        SUM(CASE WHEN estado_pago = 'pendiente' THEN total ELSE 0 END) as importe_pendiente,
                        SUM(CASE WHEN estado_pago = 'cancelado' THEN total ELSE 0 END) as importe_cancelado,
                        COUNT(DISTINCT cliente_id) as total_clientes,
                        COUNT(DISTINCT producto_id) as total_productos,
                        SUM(CASE WHEN tipo_venta = 'kilos' THEN cantidad ELSE 0 END) as total_kilos,
                        SUM(CASE WHEN tipo_venta = 'unidades' THEN cantidad ELSE 0 END) as total_unidades
                      FROM ventas v WHERE 1=1" . $sql_conditions;
        
        $stmt_stats = $conn->prepare($sql_stats);
        if (!empty($params)) {
            $stmt_stats->bind_param(str_repeat('s', count($params)), ...$params);
        }
        $stmt_stats->execute();
        $result_stats = $stmt_stats->get_result();
        $estadisticas = $result_stats->fetch_assoc();
        $stmt_stats->close();
        
        echo json_encode([
            "success" => true,
            "data" => $ventas,
            "ventas_agrupadas" => array_values($ventas_agrupadas),
            "estadisticas" => [
                "total_ventas" => intval($estadisticas['total_ventas'] ?? 0),
                "total_items" => intval($estadisticas['total_items'] ?? 0),
                "importe_total" => floatval($estadisticas['importe_total'] ?? 0),
                "importe_pagado" => floatval($estadisticas['importe_pagado'] ?? 0),
                "importe_pendiente" => floatval($estadisticas['importe_pendiente'] ?? 0),
                "importe_cancelado" => floatval($estadisticas['importe_cancelado'] ?? 0),
                "total_clientes" => intval($estadisticas['total_clientes'] ?? 0),
                "total_productos" => intval($estadisticas['total_productos'] ?? 0),
                "total_kilos" => floatval($estadisticas['total_kilos'] ?? 0),
                "total_unidades" => floatval($estadisticas['total_unidades'] ?? 0)
            ],
            "paginacion" => [
                "pagina_actual" => $pagina,
                "por_pagina" => $por_pagina,
                "total_filas" => $total_filas,
                "total_paginas" => $total_paginas
            ],
            "filtros_aplicados" => [
                "folio" => $folio,
                "cliente_id" => $cliente_id,
                "producto_id" => $producto_id,
                "fecha_inicio" => $fecha_inicio,
                "fecha_fin" => $fecha_fin,
                "estado_pago" => $estado_pago,
                "metodo_pago" => $metodo_pago,
                "tipo_venta" => $tipo_venta
            ],
            "total" => count($ventas)
        ]);
        
        $stmt->close();
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error en la consulta: " . $conn->error
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

// Cerrar conexión
$conn->close();
?>