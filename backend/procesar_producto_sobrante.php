<?php
// PROCESAR_PRODUCTO_SOBRANTE.PHP
require_once 'config.php';

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response([
        "success" => false,
        "message" => "Método no permitido. Use POST."
    ], 405);
}

// Obtener datos JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validar datos
if (!$data || !isset($data['producto_id'])) {
    json_response([
        "success" => false,
        "message" => "Datos incompletos. Se requiere 'producto_id'."
    ], 400);
}

// Sanitizar datos
$producto_id = intval($data['producto_id']);
$motivo = isset($data['motivo']) ? $conn->real_escape_string($data['motivo']) : "Manual desde tabla productos";
$usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : 1;

try {
    // PASO 1: Obtener producto
    $sql = "SELECT * FROM productos WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $producto_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response([
            "success" => false,
            "message" => "Producto no encontrado con ID: $producto_id"
        ], 404);
    }
    
    $producto = $result->fetch_assoc();
    $stmt->close();
    
    // PASO 2: Verificar si ya es sobrante
    $sql_check = "SELECT id FROM sobrantes WHERE producto_id = ? AND estado != 'descartado'";
    $stmt_check = $conn->prepare($sql_check);
    $stmt_check->bind_param("i", $producto_id);
    $stmt_check->execute();
    $check_result = $stmt_check->get_result();
    
    if ($check_result->num_rows > 0) {
        $stmt_check->close();
        json_response([
            "success" => false,
            "message" => "Este producto ya está registrado como sobrante"
        ], 400);
    }
    $stmt_check->close();
    
    // PASO 3: Crear tabla sobrantes si no existe
    $create_table = "
        CREATE TABLE IF NOT EXISTS sobrantes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            producto_id INT NOT NULL,
            producto VARCHAR(255) NOT NULL,
            producto_original VARCHAR(255),
            tipo_producto ENUM('verduras_frutas', 'otro') NOT NULL,
            kilos DECIMAL(10,2) DEFAULT 0,
            unidades INT DEFAULT 0,
            precio_kilos DECIMAL(10,2) DEFAULT 0,
            precio_unidad DECIMAL(10,2) DEFAULT 0,
            valor_total DECIMAL(10,2) DEFAULT 0,
            fecha_recibimiento DATE,
            dias_en_inventario INT DEFAULT 0,
            estado ENUM('pendiente', 'procesado', 'descartado') DEFAULT 'pendiente',
            motivo TEXT,
            observaciones TEXT,
            usuario_id INT,
            fecha_sobrante DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_procesado DATETIME,
            INDEX idx_estado (estado),
            INDEX idx_producto_id (producto_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    if (!$conn->query($create_table)) {
        throw new Exception("Error creando tabla: " . $conn->error);
    }
    
    // PASO 4: Calcular valores
    $tipo_producto = ($producto['kilos'] > 0) ? 'verduras_frutas' : 'otro';
    
    if ($tipo_producto === 'verduras_frutas') {
        $valor_total = floatval($producto['kilos']) * floatval($producto['precio_venderK']);
    } else {
        $valor_total = intval($producto['unidades']) * floatval($producto['precio_venderD']);
    }
    
    // Calcular días en inventario
    $dias_inventario = 0;
    if (!empty($producto['fecha_recibimiento'])) {
        $sql_dias = "SELECT DATEDIFF(CURDATE(), ?) as dias";
        $stmt_dias = $conn->prepare($sql_dias);
        $stmt_dias->bind_param("s", $producto['fecha_recibimiento']);
        $stmt_dias->execute();
        $result_dias = $stmt_dias->get_result();
        $row_dias = $result_dias->fetch_assoc();
        $dias_inventario = $row_dias['dias'] ?? 0;
        $stmt_dias->close();
    }
    
    // PASO 5: Insertar en sobrantes
    $sql_insert = "
        INSERT INTO sobrantes (
            producto_id, producto, producto_original, tipo_producto,
            kilos, unidades, precio_kilos, precio_unidad, valor_total,
            fecha_recibimiento, dias_en_inventario, estado, motivo, usuario_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $stmt_insert = $conn->prepare($sql_insert);
    $estado = 'pendiente';
    
    $stmt_insert->bind_param(
        "isssdddddssisi",
        $producto_id,
        $producto['producto'],
        $producto['producto'],
        $tipo_producto,
        $producto['kilos'],
        $producto['unidades'],
        $producto['precio_kilos'],
        $producto['precio_unidad'],
        $valor_total,
        $producto['fecha_recibimiento'],
        $dias_inventario,
        $estado,
        $motivo,
        $usuario_id
    );
    
    if (!$stmt_insert->execute()) {
        throw new Exception("Error insertando sobrante: " . $stmt_insert->error);
    }
    
    $sobrante_id = $stmt_insert->insert_id;
    $stmt_insert->close();
    
    // PASO 6: Suspender producto original
    $sql_suspend = "UPDATE productos SET activo = 0 WHERE id = ?";
    $stmt_suspend = $conn->prepare($sql_suspend);
    $stmt_suspend->bind_param("i", $producto_id);
    
    if (!$stmt_suspend->execute()) {
        throw new Exception("Error suspendiendo producto: " . $stmt_suspend->error);
    }
    $stmt_suspend->close();
    
    // PASO 7: Respuesta exitosa
    json_response([
        "success" => true,
        "message" => "✅ Producto '{$producto['producto']}' procesado como sobrante",
        "data" => [
            "sobrante_id" => $sobrante_id,
            "producto" => $producto['producto'],
            "valor_total" => $valor_total,
            "tipo" => $tipo_producto,
            "dias_inventario" => $dias_inventario
        ]
    ]);
    
} catch (Exception $e) {
    json_response([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ], 500);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>