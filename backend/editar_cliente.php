<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['curp'])) {
    $curp = $_GET['curp'];
    $stmt = $conn->prepare("SELECT * FROM cliente WHERE curp = ?");
    $stmt->bind_param("s", $curp);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        echo json_encode(["success" => true, "data" => $row]);
    } else {
        echo json_encode(["success" => false, "message" => "Cliente no encontrado"]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $curp = $_POST['curp'] ?? '';
    $nombre_completo = $_POST['nombre_completo'] ?? '';
    $direccion = $_POST['direccion'] ?? '';
    $codigo_postal = $_POST['codigo_postal'] ?? '';
    $colonia = $_POST['colonia'] ?? '';
    $ciudad = $_POST['ciudad'] ?? '';
    $correo = $_POST['correo'] ?? '';
    $telefono = $_POST['telefono'] ?? '';
    $notas = $_POST['notas'] ?? '';
    $tipo_pago = $_POST['tipo_pago'] ?? '';
    $medio = $_POST['medio'] ?? '';
    $adultos = $_POST['adultos'] ?? 0;
    $menores = $_POST['menores'] ?? 0;
    $sugerencias = $_POST['sugerencias'] ?? '';
    $padecimientos = $_POST['padecimientos'] ?? '';
    $quien_padece = $_POST['quien_padece'] ?? '';

    $sql = "UPDATE cliente SET 
        nombre_completo = ?, 
        direccion = ?, 
        codigo_postal = ?, 
        colonia = ?, 
        ciudad = ?, 
        correo = ?, 
        telefono = ?, 
        notas = ?, 
        tipo_pago = ?, 
        medio = ?, 
        adultos = ?, 
        menores = ?, 
        sugerencias = ?, 
        padecimientos = ?, 
        quien_padece = ?
        WHERE curp = ?";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo json_encode(["success" => false, "message" => "Error al preparar la consulta"]);
        $conn->close();
        exit;
    }

    $stmt->bind_param(
        "ssssssssssiissss",
        $nombre_completo,
        $direccion,
        $codigo_postal,
        $colonia,
        $ciudad,
        $correo,
        $telefono,
        $notas,
        $tipo_pago,
        $medio,
        $adultos,
        $menores,
        $sugerencias,
        $padecimientos,
        $quien_padece,
        $curp
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Cliente actualizado correctamente"]);
    } else {
        echo json_encode(["success" => false, "message" => "Error al actualizar cliente"]);
    }

    $stmt->close();
    $conn->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Solicitud no válida"]);
$conn->close();
?>
