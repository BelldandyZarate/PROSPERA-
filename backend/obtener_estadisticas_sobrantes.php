<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Incluir configuración de base de datos
include 'config.php';

try {
    // Conectar a la base de datos
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }
    
    $query = "SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado = 'procesado' THEN 1 ELSE 0 END) as procesados,
        SUM(CASE WHEN estado = 'descartado' THEN 1 ELSE 0 END) as descartados,
        SUM(valor_total) as valor_total,
        AVG(dias_en_inventario) as dias_promedio
    FROM sobrantes";
    
    $result = $conn->query($query);
    
    if ($result) {
        $estadisticas = $result->fetch_assoc();
        
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "estadisticas" => $estadisticas
        ]);
    } else {
        throw new Exception("Error en la consulta: " . $conn->error);
    }
    
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(200);
    echo json_encode([
        "success" => false,
        "estadisticas" => null,
        "message" => $e->getMessage()
    ]);
}
?>