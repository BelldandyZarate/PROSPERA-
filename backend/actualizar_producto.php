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
$observaciones = isset($data['observaciones']) ? trim($conn->real_escape_string($data['observaciones'])) : ''; // Nuevo campo

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

try {
    // Iniciar transacción
    $conn->begin_transaction();
    
    // 1. Obtener los valores actuales ANTES de actualizar
    $check_sql = "SELECT 
                    p.id,
                    p.producto,
                    p.kilos,
                    p.precio_kilos,
                    p.precio_venderK,
                    p.unidades,
                    p.precio_unidad,
                    p.precio_venderD,
                    p.observaciones  -- Añadido para obtener observaciones actuales
                  FROM productos p 
                  WHERE p.id = ?";
    
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
    
    // 2. Preparar consulta UPDATE (incluyendo observaciones)
    $sql = "UPDATE productos SET 
                producto = ?, 
                kilos = ?, 
                precio_kilos = ?, 
                precio_venderK = ?, 
                unidades = ?, 
                precio_unidad = ?, 
                precio_venderD = ?, 
                fecha_recibimiento = ?,
                observaciones = ?  -- Nuevo campo agregado
            WHERE id = ?";
    
    error_log("🔍 SQL a ejecutar: " . $sql);
    
    $stmt = $conn->prepare($sql);
    
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta UPDATE: " . $conn->error);
    }
    
    // Los tipos: s (string), d (double), d (double), d (double), i (integer), d (double), d (double), s (string), s (string), i (integer)
    $stmt->bind_param(
        "sdddiddssi",
        $producto,
        $kilos,
        $precio_kilos,
        $precio_venderK,
        $unidades,
        $precio_unidad,
        $precio_venderD,
        $fecha_recibimiento,
        $observaciones,  // Nuevo parámetro
        $id
    );
    
    $executed = $stmt->execute();
    
    if (!$executed) {
        throw new Exception("Error al ejecutar la consulta: " . $stmt->error);
    }
    
    $affected_rows = $stmt->affected_rows;
    $stmt->close();
    
    // 3. Registrar cambios en historial si hubo cambios
    if ($affected_rows > 0) {
        // Determinar usuario (puedes obtenerlo de sesión o token)
        $usuario = 'Sistema'; // Por defecto
        if (isset($data['usuario']) && !empty($data['usuario'])) {
            $usuario = trim($data['usuario']);
        } elseif (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        if (isset($_SESSION['usuario'])) {
            $usuario = $_SESSION['usuario'];
        }
        
        // Motivo del cambio (opcional)
        $motivo = isset($data['motivo_cambio']) ? trim($data['motivo_cambio']) : 'Actualización de precio';
        
        // Función para registrar un cambio en historial
        $registrar_cambio = function($conn, $producto_id, $producto_nombre, $campo, $valor_anterior, $valor_nuevo, $usuario, $motivo = '') {
            // Solo registrar si hay cambio real
            if ($valor_anterior != $valor_nuevo) {
                $sql = "INSERT INTO historial_precios 
                        (producto_id, producto_nombre, campo_cambiado, precio_anterior, precio_nuevo, usuario, motivo)
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
                
                $stmt = $conn->prepare($sql);
                if (!$stmt) {
                    error_log("⚠️ Error preparando inserción en historial: " . $conn->error);
                    return false;
                }
                
                $stmt->bind_param("issddss", 
                    $producto_id, 
                    $producto_nombre, 
                    $campo, 
                    $valor_anterior, 
                    $valor_nuevo, 
                    $usuario, 
                    $motivo
                );
                
                $result = $stmt->execute();
                $stmt->close();
                
                if ($result) {
                    error_log("📝 Registrado en historial: Producto {$producto_id}, Campo {$campo}, De {$valor_anterior} a {$valor_nuevo}");
                } else {
                    error_log("⚠️ Error registrando en historial");
                }
                
                return $result;
            }
            return false;
        };
        
        // Registrar cambios según tipo de producto
        if ($tipo_producto === 'verduras_frutas') {
            // Verificar cambios en precios de verduras/frutas
            if ($producto_actual['precio_kilos'] != $precio_kilos) {
                $registrar_cambio($conn, $id, $producto, 'precio_kilos', 
                    $producto_actual['precio_kilos'], $precio_kilos, $usuario, $motivo);
            }
            
            if ($producto_actual['precio_venderK'] != $precio_venderK) {
                $registrar_cambio($conn, $id, $producto, 'precio_venderK', 
                    $producto_actual['precio_venderK'], $precio_venderK, $usuario, $motivo);
            }
            
            // Registrar cambio de kilos si aplica
            if ($producto_actual['kilos'] != $kilos) {
                $registrar_cambio($conn, $id, $producto, 'kilos', 
                    $producto_actual['kilos'], $kilos, $usuario, 'Cambio en cantidad');
            }
            
        } else {
            // Verificar cambios en precios de otros productos
            if ($producto_actual['precio_unidad'] != $precio_unidad) {
                $registrar_cambio($conn, $id, $producto, 'precio_unidad', 
                    $producto_actual['precio_unidad'], $precio_unidad, $usuario, $motivo);
            }
            
            if ($producto_actual['precio_venderD'] != $precio_venderD) {
                $registrar_cambio($conn, $id, $producto, 'precio_venderD', 
                    $producto_actual['precio_venderD'], $precio_venderD, $usuario, $motivo);
            }
            
            // Registrar cambio de unidades si aplica
            if ($producto_actual['unidades'] != $unidades) {
                $registrar_cambio($conn, $id, $producto, 'unidades', 
                    $producto_actual['unidades'], $unidades, $usuario, 'Cambio en cantidad');
            }
        }
        
        // Registrar cambio de nombre si aplica
        if ($producto_actual['producto'] != $producto) {
            $registrar_cambio($conn, $id, $producto_actual['producto'], 'nombre_producto', 
                0, 1, $usuario, 'Cambio de nombre del producto: ' . $producto_actual['producto'] . ' → ' . $producto);
        }
        
        // Registrar cambio en observaciones si aplica
        $observaciones_actual = $producto_actual['observaciones'] ?? '';
        if ($observaciones_actual != $observaciones) {
            // Crear un resumen del cambio para el historial
            $resumen_observaciones = "Observaciones actualizadas";
            if (!empty($observaciones_actual) && !empty($observaciones)) {
                $resumen_observaciones = "Observaciones modificadas: '" . 
                    substr($observaciones_actual, 0, 50) . (strlen($observaciones_actual) > 50 ? '...' : '') . 
                    "' → '" . 
                    substr($observaciones, 0, 50) . (strlen($observaciones) > 50 ? '...' : '') . "'";
            } elseif (!empty($observaciones)) {
                $resumen_observaciones = "Observaciones añadidas: '" . 
                    substr($observaciones, 0, 50) . (strlen($observaciones) > 50 ? '...' : '') . "'";
            } elseif (!empty($observaciones_actual)) {
                $resumen_observaciones = "Observaciones eliminadas";
            }
            
            $registrar_cambio($conn, $id, $producto, 'observaciones', 
                0, 1, $usuario, $resumen_observaciones);
            
            error_log("📝 Cambio en observaciones registrado: " . $resumen_observaciones);
        }
        
        error_log("✅ Cambios registrados en historial para producto ID: {$id}");
    }
    
    // 4. Confirmar transacción
    $conn->commit();
    
    error_log("✅ Transacción completada. Filas afectadas: " . $affected_rows);
    
    if ($affected_rows > 0) {
        echo json_encode([
            "success" => true,
            "message" => "Producto actualizado correctamente",
            "id" => $id,
            "affected_rows" => $affected_rows,
            "producto" => $producto,
            "historial_registrado" => true,
            "observaciones" => $observaciones // Incluir observaciones en la respuesta
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