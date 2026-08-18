<?php
include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

$nombre = $data['nombre'] ?? '';

$sql = "INSERT INTO usuarios (nombre) VALUES (?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $nombre);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}
