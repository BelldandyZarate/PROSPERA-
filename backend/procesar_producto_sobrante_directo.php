<?php
// api/procesar_producto_sobrante.php
// VERSIÓN DEFINITIVA - CONEXIÓN DIRECTA

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

// ====================================================
// 1. CONEXIÓN DIRECTA A LA BASE DE DATOS
// ====================================================
$host = "localhost";
$user = "root";
$password = "";
$database = "mi_base_de_datos"; // ¡¡¡CAMBIAR POR EL NOMBRE REAL!!!

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "ERROR: No se puede conectar a la base de datos",
        "error" => $conn->connect_error,
        "suggestion" => "Verifica que la base de datos '$database' exista en phpMyAdmin"
    ]);
    exit;
}

// ====================================================
// 2. OBTENER DATOS DEL PRODUCTO
// ====================================================
// Leer datos JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Si no hay JSON, usar POST normal
if (!$data && !empty($_POST)) {
    $data = $_POST;
}

// Validar que tenemos producto_id
if (!$data || !isset($data['producto_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "Error: Se requiere ID del producto"
    ]);
    $conn->close();
    exit;
}

$producto_id = intval($data['producto_id']);
$motivo = isset($data['motivo']) ? $data['motivo'] : "Manual desde tabla de productos";
$usuario_id = isset($data['usuario_id']) ? intval($data['usuario_id']) : 1;

// ====================================================
// 3. VERIFICAR QUE EL PRODUCTO EXISTE
// ====================================================
$sql = "SELECT * FROM productos WHERE id = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Error preparando consulta: " . $conn->error
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("i", $producto_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Error: Producto con ID $producto_id no encontrado"
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$producto = $result->fetch_assoc();
$stmt->close();

// ====================================================
// 4. CREAR TABLA SOBRANTES SI NO EXISTE
// ====================================================
$create_table = "CREATE TABLE IF NOT EXISTS sobrantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    producto VARCHAR(255) NOT NULL,
    tipo_producto VARCHAR(50),
    kilos DECIMAL(10,2),
    unidades INT,
    precio_kilos DECIMAL(10,2),
    precio_unidad DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    fecha_recibimiento DATE,
    dias_en_inventario INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'pendiente',
    motivo TEXT,
    usuario_id INT,
    fecha_sobrante TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX (producto_id),
    INDEX (estado)
)";

if (!$conn->query($create_table)) {
    echo json_encode([
        "success" => false,
        "message" => "Error creando tabla: " . $conn->error
    ]);
    $conn->close();
    exit;
}

// ====================================================
// 5. INSERTAR EN SOBRANTES
// ====================================================
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

// Determinar tipo
$tipo_producto = ($producto['kilos'] > 0) ? 'verduras_frutas' : 'otro';

// Calcular valor
if ($tipo_producto === 'verduras_frutas') {
    $valor_total = floatval($producto['kilos']) * floatval($producto['precio_venderK']);
} else {
    $valor_total = intval($producto['unidades']) * floatval($producto['precio_venderD']);
}

// Insertar
$sql_insert = "INSERT INTO sobrantes (
    producto_id, producto, tipo_producto, kilos, unidades,
    precio_kilos, precio_unidad, valor_total, fecha_recibimiento,
    dias_en_inventario, motivo, usuario_id
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt_insert = $conn->prepare($sql_insert);
$stmt_insert->bind_param(
    "issdddddsssi",
    $producto_id,
    $producto['producto'],
    $tipo_producto,
    $producto['kilos'],
    $producto['unidades'],
    $producto['precio_kilos'],
    $producto['precio_unidad'],
    $valor_total,
    $producto['fecha_recibimiento'],
    $dias_inventario,
    $motivo,
    $usuario_id
);

if (!$stmt_insert->execute()) {
    echo json_encode([
        "success" => false,
        "message" => "Error insertando sobrante: " . $stmt_insert->error
    ]);
    $stmt_insert->close();
    $conn->close();
    exit;
}

$sobrante_id = $stmt_insert->insert_id;
$stmt_insert->close();

// ====================================================
// 6. SUSPENDER PRODUCTO ORIGINAL
// ====================================================
$sql_update = "UPDATE productos SET activo = 0 WHERE id = ?";
$stmt_update = $conn->prepare($sql_update);
$stmt_update->bind_param("i", $producto_id);
$stmt_update->execute();
$stmt_update->close();

// ====================================================
// 7. RESPUESTA EXITOSA
// ====================================================
echo json_encode([
    "success" => true,
    "message" => "✅ Producto '{$producto['producto']}' procesado como sobrante",
    "sobrante_id" => $sobrante_id,
    "producto_nombre" => $producto['producto'],
    "valor_total" => $valor_total,
    "tipo" => $tipo_producto
]);

$conn->close();
?>