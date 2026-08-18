<?php
include 'config.php';

$nombre = $_POST['nombre'] ?? '';
$usuario = $_POST['usuario'] ?? '';
$contrasena = $_POST['contrasena'] ?? '';
$rol = $_POST['rol'] ?? '';
$activo = isset($_POST['activo']) ? 1 : 0;

$directorio = "upload/usuario/" . $nombre;

if (!file_exists($directorio)) {
    mkdir($directorio, 0777, true);
}

$foto_nombre = $_FILES['foto']['name'];
$foto_temp = $_FILES['foto']['tmp_name'];
$ruta_foto = $directorio . '/' . $foto_nombre;

move_uploaded_file($foto_temp, $ruta_foto);

$hashed = password_hash($contrasena, PASSWORD_DEFAULT);

$sql = "INSERT INTO usuarios (nombre, usuario, contrasena, rol, activo, foto) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssis", $nombre, $usuario, $hashed, $rol, $activo, $ruta_foto);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $conn->error]);
}
?>
