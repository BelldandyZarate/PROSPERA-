<?php
header("Content-Type: application/json");
include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$nombre_completo = $data["nombre_completo"] ?? '';

if (empty($nombre_completo)) {
    echo json_encode(["success" => false, "message" => "Nombre vacío"]);
    exit;
}

$sql = "DELETE FROM cliente WHERE nombre_completo = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $nombre_completo);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Error al eliminar"]);
}

$stmt->close();
$conn->close();
?>
