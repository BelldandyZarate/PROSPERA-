<?php
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Habilitar reporte de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Manejar solicitud preflight OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir configuración de la base de datos
include 'config.php';

// Verificar conexión a la base de datos
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "error" => "Error de conexión a la base de datos: " . $conn->connect_error
    ]);
    exit();
}

// Obtener el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Permitir solo POST
if ($method !== 'POST') {
    echo json_encode([
        "success" => false,
        "error" => "Método no permitido. Se requiere POST, recibido: " . $method
    ]);
    exit;
}

// Leer los datos de entrada
$input = file_get_contents("php://input");

if (empty($input)) {
    echo json_encode([
        "success" => false,
        "error" => "No se recibieron datos",
        "method" => $method,
        "content_type" => $_SERVER['CONTENT_TYPE'] ?? 'No especificado'
    ]);
    exit;
}

// Log para debugging
error_log("📥 Datos recibidos en actualizar_producto.php: " . $input);

// Intentar decodificar JSON
$data = json_decode($input, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    $error = json_last_error_msg();
    echo json_encode([
        "success" => false,
        "error" => "Error decodificando JSON: " . $error,
        "json_error_code" => json_last_error(),
        "raw_input" => substr($input, 0, 500)
    ]);
    exit;
}

// Validar que se recibieron datos
if (empty($data)) {
    echo json_encode([
        "success" => false,
        "error" => "No se recibieron datos JSON válidos",
        "data_received" => $data
    ]);
    exit;
}

// Log de datos recibidos para debugging
error_log("📝 Datos JSON recibidos: " . print_r($data, true));

// Validar campos requeridos
$camposRequeridos = ['id', 'producto', 'tipo_producto', 'fecha_recibimiento'];
$camposFaltantes = [];

foreach ($camposRequeridos as $campo) {
    if (!isset($data[$campo]) || (is_string($data[$campo]) && trim($data[$campo]) === '')) {
        $camposFaltantes[] = $campo;
    }
}

if (!empty($camposFaltantes)) {
    echo json_encode([
        "success" => false,
        "error" => "Campos requeridos faltantes: " . implode(', ', $camposFaltantes),
        "data_received" => $data
    ]);
    exit;
}

// Sanitizar y validar datos
$id = intval($data['id']);
$producto = trim($conn->real_escape_string($data['producto']));
$tipo_producto = trim($data['tipo_producto']);
$fecha_recibimiento = trim($data['fecha_recibimiento']);

// Validar ID
if ($id <= 0) {
    echo json_encode([
        "success" => false,
        "error" => "ID inválido: " . $data['id']
    ]);
    exit;
}

// Validar fecha
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha_recibimiento)) {
    echo json_encode([
        "success" => false,
        "error" => "Formato de fecha inválido. Use YYYY-MM-DD"
    ]);
    exit;
}

// Preparar valores según tipo de producto
if ($tipo_producto === 'verduras_frutas') {
    $kilos = isset($data['kilos']) ? floatval($data['kilos']) : 0;
    $precio_kilos = isset($data['precio_kilos']) ? floatval($data['precio_kilos']) : 0;
    $precio_venderK = isset($data['precio_venderK']) ? floatval($data['precio_venderK']) : 0;
    $unidades = 0;
    $precio_unidad = 0;
    $precio_venderD = 0;
    
    // Validar valores para verduras/frutas
    if ($kilos <= 0 || $precio_kilos <= 0 || $precio_venderK <= 0) {
        echo json_encode([
            "success" => false,
            "error" => "Valores inválidos para verduras/frutas. Kilos, precio_kilos y precio_venderK deben ser mayores a 0"
        ]);
        exit;
    }
} elseif ($tipo_producto === 'otro') {
    $unidades = isset($data['unidades']) ? intval($data['unidades']) : 0;
    $precio_unidad = isset($data['precio_unidad']) ? floatval($data['precio_unidad']) : 0;
    $precio_venderD = isset($data['precio_venderD']) ? floatval($data['precio_venderD']) : 0;
    $kilos = 0;
    $precio_kilos = 0;
    $precio_venderK = 0;
    
    // Validar valores para otros productos
    if ($unidades <= 0 || $precio_unidad <= 0 || $precio_venderD <= 0) {
        echo json_encode([
            "success" => false,
            "error" => "Valores inválidos para otros productos. Unidades, precio_unidad y precio_venderD deben ser mayores a 0"
        ]);
        exit;
    }
} else {
    echo json_encode([
        "success" => false,
        "error" => "Tipo de producto inválido. Use 'verduras_frutas' o 'otro'"
    ]);
    exit;
}

// Usuario (puedes obtenerlo de sesión o token)
$usuario = 'Sistema'; // Por defecto
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
if (isset($_SESSION['usuario'])) {
    $usuario = $_SESSION['usuario'];
}

try {
    // Iniciar transacción para atomicidad
    $conn->begin_transaction();
    
    // 1. Primero, obtener los valores actuales del producto ANTES de actualizar
    $check_sql = "SELECT * FROM productos WHERE id = ?";
    $check_stmt = $conn->prepare($check_sql);
    
    if (!$check_stmt) {
        throw new Exception("Error al preparar consulta de verificación: " . $conn->error);
    }
    
    $check_stmt->bind_param("i", $id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();
    $producto_actual = $result->fetch_assoc();
    $check_stmt->close();
    
    if (!$producto_actual) {
        throw new Exception("Producto no encontrado con ID: " . $id);
    }
    
    // 2. Preparar consulta UPDATE
    $sql = "UPDATE productos SET 
                producto = ?, 
                tipo_producto = ?,
                kilos = ?, 
                precio_kilos = ?, 
                precio_venderK = ?, 
                unidades = ?, 
                precio_unidad = ?, 
                precio_venderD = ?, 
                fecha_recibimiento = ?,
                usuario_modificacion = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?";
    
    error_log("🔍 SQL a ejecutar: " . $sql);
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta UPDATE: " . $conn->error);
    }
    
    // Los tipos: s (string), s (string), d (double), d (double), d (double), i (integer), d (double), d (double), s (string), s (string), i (integer)
    $stmt->bind_param(
        "ssdddiddssi",
        $producto,
        $tipo_producto,
        $kilos,
        $precio_kilos,
        $precio_venderK,
        $unidades,
        $precio_unidad,
        $precio_venderD,
        $fecha_recibimiento,
        $usuario,
        $id
    );
    
    $executed = $stmt->execute();
    
    if (!$executed) {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }
    
    $affected_rows = $stmt->affected_rows;
    $stmt->close();
    
    // 3. Registrar cambios en el historial de precios si hubo cambios
    if ($affected_rows > 0) {
        // Definir campos de precio a monitorear
        $campos_precio = [
            'precio_kilos' => 'Precio por Kilo (Compra)',
            'precio_venderK' => 'Precio por Kilo (Venta)',
            'precio_unidad' => 'Precio por Unidad (Compra)',
            'precio_venderD' => 'Precio por Unidad (Venta)'
        ];
        
        // Insertar en historial solo si hay cambios en los precios
        $historial_stmt = $conn->prepare("
            INSERT INTO historial_precios 
            (producto_id, campo_modificado, valor_anterior, valor_nuevo, usuario)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($campos_precio as $campo_db => $descripcion) {
            $valor_anterior = $producto_actual[$campo_db] ?? 0;
            $valor_nuevo = ${$campo_db} ?? 0; // Usamos variable variable
            
            // Convertir a float para comparación
            $valor_anterior_float = floatval($valor_anterior);
            $valor_nuevo_float = floatval($valor_nuevo);
            
            // Si hay cambio y el nuevo valor no es cero (para evitar registrar cuando se cambia de tipo)
            if (abs($valor_anterior_float - $valor_nuevo_float) > 0.001 && $valor_nuevo_float > 0) {
                error_log("📊 Registrando cambio en historial: {$descripcion} - De {$valor_anterior} a {$valor_nuevo}");
                
                $historial_stmt->bind_param(
                    "issss",
                    $id,
                    $descripcion,
                    $valor_anterior,
                    $valor_nuevo,
                    $usuario
                );
                
                if (!$historial_stmt->execute()) {
                    error_log("⚠️ Error al registrar historial: " . $historial_stmt->error);
                    // Continuar con otros campos aunque falle uno
                }
            }
        }
        
        $historial_stmt->close();
    }
    
    // 4. Confirmar transacción
    $conn->commit();
    
    error_log("✅ Filas afectadas: " . $affected_rows . " | Transacción completada");
    
    if ($affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Producto actualizado correctamente",
            "id" => $id,
            "affected_rows" => $affected_rows,
            "producto" => $producto,
            "historial_registrado" => true
        ]);
    } else {
        // No hubo cambios pero la operación fue exitosa
        echo json_encode([
            "success" => true,
            "message" => "No se realizaron cambios (los datos eran iguales)",
            "id" => $id,
            "affected_rows" => $affected_rows,
            "warning" => "Los datos enviados son idénticos a los existentes"
        ]);
    }
    
} catch (Exception $e) {
    // Revertir transacción en caso de error
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->rollback();
    }
    
    error_log("❌ Error en actualizar_producto.php: " . $e->getMessage());
    error_log("❌ Trace: " . $e->getTraceAsString());
    
    echo json_encode([
        "success" => false,
        "error" => "Error del servidor: " . $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}

$conn->close();
?>