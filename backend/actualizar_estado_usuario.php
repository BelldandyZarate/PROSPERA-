<?php
include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'];
$activo = $data['activo'];

$sql = "UPDATE usuarios SET activo = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $activo, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}
