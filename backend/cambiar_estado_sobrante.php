<?php
require_once 'config.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['id']) || !isset($data['estado'])) {
    json_response(["success" => false, "message" => "Datos incompletos"], 400);
}

$id = intval($data['id']);
$estado = $conn->real_escape_string($data['estado']);

$sql = "UPDATE sobrantes SET estado = ?, fecha_procesado = NOW() WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $estado, $id);

if ($stmt->execute()) {
    json_response(["success" => true, "message" => "Estado actualizado"]);
} else {
    json_response(["success" => false, "message" => "Error: " . $stmt->error], 500);
}
?>