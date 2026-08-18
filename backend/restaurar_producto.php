<?php
// restaurar_producto.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'config.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : null;

if (!$id || $id <= 0) {
    echo json_encode(["success" => false, "message" => "ID no válido"]);
    exit();
}

try {
    $sql = "UPDATE productos SET estado = 1 WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Producto restaurado correctamente"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error al restaurar el producto"
        ]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$conn->close();
?>