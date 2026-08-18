<?php
include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);
$usuario = $data['usuario'] ?? '';
$contrasena = $data['contrasena'] ?? '';

$sql = "SELECT * FROM usuarios WHERE usuario = ? AND activo = 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $usuario);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    if (password_verify($contrasena, $row['contrasena'])) {
        echo json_encode(["success" => true, "usuario" => $row]);
    } else {
        echo json_encode(["success" => false, "error" => "Contraseña incorrecta"]);
    }
} else {
    echo json_encode(["success" => false, "error" => "Usuario no encontrado o inactivo"]);
}
?>
