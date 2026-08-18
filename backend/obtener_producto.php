<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
include 'config.php';

if (!isset($_GET['id'])) {
    echo json_encode(["success" => false, "error" => "ID no especificado"]);
    exit;
}

$id = intval($_GET['id']);

// Consulta explícita con todos los campos
$sql = "SELECT 
    id, 
    producto, 
    kilos, 
    precio_kilos, 
    precio_venderK, 
    unidades, 
    precio_unidad, 
    precio_venderD, 
    fecha_recibimiento 
    FROM productos 
    WHERE id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "Error al preparar la consulta"]);
    exit;
}

$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    // Formatear la respuesta
    $response = [
        "success" => true,
        "data" => [
            "id" => intval($row['id']),
            "producto" => $row['producto'],
            "kilos" => $row['kilos'] ? floatval($row['kilos']) : null,
            "precio_kilos" => $row['precio_kilos'] ? floatval($row['precio_kilos']) : null,
            "precio_venderK" => $row['precio_venderK'] ? floatval($row['precio_venderK']) : null,
            "unidades" => $row['unidades'] ? intval($row['unidades']) : null,
            "precio_unidad" => $row['precio_unidad'] ? floatval($row['precio_unidad']) : null,
            "precio_venderD" => $row['precio_venderD'] ? floatval($row['precio_venderD']) : null,
            "fecha_recibimiento" => $row['fecha_recibimiento']
        ]
    ];
    
    echo json_encode($response);
} else {
    echo json_encode(["success" => false, "error" => "Producto no encontrado"]);
}

$stmt->close();
$conn->close();
?>