<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

// Incluir configuración de base de datos
include 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    try {
        // Conectar a la base de datos
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            throw new Exception("Error de conexión: " . $conn->connect_error);
        }
        
        $query = "DELETE FROM sobrantes WHERE id = ?";
        $stmt = $conn->prepare($query);
        
        if (!$stmt) {
            throw new Exception("Error al preparar la consulta: " . $conn->error);
        }
        
        $id = $data->id;
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Sobrante eliminado correctamente"
            ]);
        } else {
            throw new Exception("Error al eliminar: " . $stmt->error);
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
        "message" => "ID no proporcionado"
    ]);
}
?>