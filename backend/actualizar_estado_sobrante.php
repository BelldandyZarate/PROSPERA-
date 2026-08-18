<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Incluir configuración de base de datos
include 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->estado)) {
    try {
        // Conectar a la base de datos
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Error de conexión: " . $conn->connect_error);
        }
        
        $query = "UPDATE sobrantes SET 
            estado = ?,
            fecha_procesado = CASE WHEN ? = 'procesado' THEN NOW() ELSE NULL END,
            observaciones = CONCAT(COALESCE(observaciones, ''), ?)
            WHERE id = ?";
        
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        
        $observacion_adicional = "\n\n" . date('Y-m-d H:i:s') . " - Estado cambiado a: " . $data->estado;
        if (!empty($data->observacion_adicional)) {
            $observacion_adicional .= "\n" . $data->observacion_adicional;
        }
        
        $estado = $data->estado;
        $id = $data->id;
        
        $stmt->bind_param("sssi", $estado, $estado, $observacion_adicional, $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Estado actualizado correctamente"
            ]);
        } else {
            throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
        }
        
        $stmt->close();
        $conn->close();
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Datos incompletos. Se requieren: id y estado"
    ]);
}
?>