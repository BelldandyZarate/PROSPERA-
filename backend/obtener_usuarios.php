<?php
include 'config.php';

$sql = "SELECT id, nombre, usuario, rol, activo, foto FROM usuarios";
$result = $conn->query($sql);

$usuarios = [];
while ($row = $result->fetch_assoc()) {
    $usuarios[] = $row;
}

echo json_encode($usuarios);
