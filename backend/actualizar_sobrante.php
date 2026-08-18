<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->estado)) {
    try {
        $query = "UPDATE sobrantes SET 
            estado = :estado,
            fecha_procesado = CASE WHEN :estado = 'procesado' THEN NOW() ELSE NULL END,
            observaciones = CONCAT(observaciones, :observaciones_extra)
            WHERE id = :id";
        
        $stmt = $db->prepare($query);
        
        $observaciones_extra = "\n\n" . date('Y-m-d H:i:s') . " - Estado cambiado a: " . $data->estado;
        if (!empty($data->observacion_adicional)) {
            $observaciones_extra .= "\nObservación: " . $data->observacion_adicional;
        }
        
        $stmt->bindParam(':id', $data->id);
        $stmt->bindParam(':estado', $data->estado);
        $stmt->bindParam(':observaciones_extra', $observaciones_extra);
        
        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Estado del sobrante actualizado correctamente"
            ]);
        } else {
            http_response_code(503);
            echo json_encode([
                "success" => false,
                "message" => "No se pudo actualizar el estado"
            ]);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Error en la base de datos: " . $e->getMessage()
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