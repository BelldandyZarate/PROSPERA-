<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Manejar preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST' || $_SERVER['REQUEST_METHOD'] == 'GET') {
    
    $id = null;
    
    // Obtener ID según método
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = isset($data['id']) ? intval($data['id']) : null;
    } else {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    }
    
    if (!$id || $id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "ID de producto no válido"
        ]);
        exit();
    }
    
    try {
        // Verificar si el producto existe
        $check_sql = "SELECT id, producto, activo FROM productos WHERE id = ?";
        $check_stmt = $conn->prepare($check_sql);
        
        if (!$check_stmt) {
            throw new Exception("Error al preparar consulta: " . $conn->error);
        }
        
        $check_stmt->bind_param("i", $id);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Producto no encontrado con ID: $id"
            ]);
            $check_stmt->close();
            exit();
        }
        
        $producto = $result->fetch_assoc();
        $nombre_producto = $producto['producto'];
        $activo_actual = $producto['activo'];
        $check_stmt->close();
        
        // Determinar nuevo estado (alternar entre 0 y 1)
        $nuevo_valor = $activo_actual ? 0 : 1;
        $action = $activo_actual ? 'suspender' : 'reactivar';
        $message = $activo_actual 
            ? "Producto '$nombre_producto' suspendido correctamente"
            : "Producto '$nombre_producto' reactivado correctamente";
        
        // Actualizar el campo activo del producto
        $sql = "UPDATE productos SET activo = ?, fecha_actualizacion = NOW() WHERE id = ?";
        
        $stmt = $conn->prepare($sql);
        
        if (!$stmt) {
            throw new Exception("Error al preparar consulta: " . $conn->error);
        }
        
        $stmt->bind_param("ii", $nuevo_valor, $id);
        
        if ($stmt->execute()) {
            $affected_rows = $stmt->affected_rows;
            
            echo json_encode([
                "success" => true,
                "message" => $message,
                "producto_id" => $id,
                "producto_nombre" => $nombre_producto,
                "action" => $action,
                "nuevo_estado" => $nuevo_valor,
                "estado_texto" => $nuevo_valor ? 'activo' : 'inactivo',
                "affected_rows" => $affected_rows
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Error al cambiar el estado del producto: " . $stmt->error
            ]);
        }
        
        $stmt->close();
        
    } catch (Exception $e) {
        echo json_encode([
            "success" => false,
            "message" => "Error: " . $e->getMessage()
        ]);
    }
    
} else {
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido"
    ]);
}

$conn->close();
?>