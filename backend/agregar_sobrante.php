<?php
// IMPORTANTE: Headers deben ir primero, sin espacios antes
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 3600");

// Manejar preflight request de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar si es POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Método no permitido. Use POST."
    ]);
    exit;
}

// Obtener datos JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Verificar si se recibieron datos
if (!$data) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No se recibieron datos JSON válidos."
    ]);
    exit;
}

// Verificar campos requeridos
if (empty($data['producto_id']) || empty($data['producto']) || empty($data['tipo_producto']) || empty($data['motivo'])) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Faltan campos requeridos: producto_id, producto, tipo_producto, motivo"
    ]);
    exit;
}

try {
    // Incluir archivo de configuración
    require_once 'config.php';
    
    // Verificar que la conexión existe
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception("Error de conexión a la base de datos");
    }
    
    // Asignar valores con defaults y escapar para seguridad
    $producto_id = intval($data['producto_id']);
    $producto = $conn->real_escape_string($data['producto']);
    $producto_original = isset($data['producto_original']) ? $conn->real_escape_string($data['producto_original']) : $producto;
    $tipo_producto = $conn->real_escape_string($data['tipo_producto']);
    $kilos = floatval($data['kilos'] ?? 0);
    $unidades = intval($data['unidades'] ?? 0);
    $precio_kilos = floatval($data['precio_kilos'] ?? 0);
    $precio_unidad = floatval($data['precio_unidad'] ?? 0);
    $valor_total = floatval($data['valor_total'] ?? 0);
    $fecha_recibimiento = $conn->real_escape_string($data['fecha_recibimiento'] ?? date('Y-m-d'));
    $dias_en_inventario = intval($data['dias_en_inventario'] ?? 0);
    $estado = 'pendiente';
    $motivo = $conn->real_escape_string($data['motivo']);
    $observaciones = isset($data['observaciones']) ? $conn->real_escape_string($data['observaciones']) : '';
    $usuario_id = intval($data['usuario_id'] ?? 0);
    
    // Construir la consulta SQL
    $sql = "INSERT INTO sobrantes (
        producto_id, 
        producto, 
        producto_original, 
        tipo_producto, 
        kilos, 
        unidades, 
        precio_kilos, 
        precio_unidad, 
        valor_total, 
        fecha_recibimiento, 
        dias_en_inventario, 
        estado, 
        motivo, 
        observaciones, 
        usuario_id, 
        fecha_sobrante
    ) VALUES (
        $producto_id, 
        '$producto', 
        '$producto_original', 
        '$tipo_producto', 
        $kilos, 
        $unidades, 
        $precio_kilos, 
        $precio_unidad, 
        $valor_total, 
        '$fecha_recibimiento', 
        $dias_en_inventario, 
        '$estado', 
        '$motivo', 
        '$observaciones', 
        $usuario_id, 
        NOW()
    )";
    
    // Ejecutar consulta
    if ($conn->query($sql) === TRUE) {
        $sobrante_id = $conn->insert_id;
        
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Producto agregado a sobrantes correctamente",
            "sobrante_id" => $sobrante_id
        ]);
    } else {
        throw new Exception("Error al ejecutar la consulta: " . $conn->error);
    }
    
    // Cerrar conexión
    $conn->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
?>