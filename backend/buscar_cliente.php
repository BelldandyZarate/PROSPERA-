<?php
header('Content-Type: application/json');
include 'config.php';  // Incluye tu archivo de conexión

if (!isset($_GET['curp'])) {
    echo json_encode([
        "success" => false,
        "message" => "Falta parámetro CURP."
    ]);
    exit();
}

$curp = $conn->real_escape_string($_GET['curp']);

$sql = "SELECT curp, nombre_completo, direccion, codigo_postal, colonia, ciudad, correo, telefono, notas, barcode_img 
        FROM cliente WHERE curp = '$curp' LIMIT 1";

$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    $cliente = $result->fetch_assoc();

    echo json_encode([
        "success" => true,
        "data" => $cliente
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Cliente no encontrado."
    ]);
}

$conn->close();
