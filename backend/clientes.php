<?php
// clientes.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión a la base de datos: " . $conn->connect_error]);
    exit;
}

// Obtener parámetros de búsqueda
$barcode = isset($_GET['barcode']) ? trim($_GET['barcode']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Búsqueda por ID específico
if ($id > 0) {
    $sql = "SELECT * FROM cliente WHERE id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result && $result->num_rows > 0) {
        $cliente = $result->fetch_assoc();
        echo json_encode($cliente);
    } else {
        echo json_encode(["error" => "Cliente no encontrado"]);
    }
    $stmt->close();
    $conn->close();
    exit;
}

// Búsqueda por CURP
if (!empty($barcode)) {
    $barcodeUpper = strtoupper($barcode);
    
    $sql = "SELECT * FROM cliente 
            WHERE UPPER(barcode_img) = ? 
               OR UPPER(curp) = ? 
               OR UPPER(codigo_barras) = ?
            ORDER BY nombre_completo";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sss", $barcodeUpper, $barcodeUpper, $barcodeUpper);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $clientes = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row;
        }
    }
    echo json_encode($clientes);
    $stmt->close();
    $conn->close();
    exit;
}

// Búsqueda por nombre
if (!empty($search)) {
    $searchTerm = "%$search%";
    $sql = "SELECT * FROM cliente 
            WHERE nombre_completo LIKE ?
            ORDER BY nombre_completo";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $searchTerm);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $clientes = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $clientes[] = $row;
        }
    }
    echo json_encode($clientes);
    $stmt->close();
    $conn->close();
    exit;
}

// Devolver todos los clientes
$sql = "SELECT * FROM cliente ORDER BY nombre_completo";
$result = $conn->query($sql);

$clientes = [];
if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $clientes[] = $row;
    }
}

echo json_encode($clientes);
$conn->close();
?>