<?php
// api/actualizar_estado_venta.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once 'config.php';

if (!$conn || $conn->connect_error) {
    echo json_encode([
        "success" => false, 
        "message" => "Error de conexión a la base de datos"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id)) {
    echo json_encode([
        "success" => false, 
        "message" => "Datos incompletos. Se requiere el ID de la venta"
    ]);
    exit;
}

$id_venta = intval($data->id);
$estado_pago = isset($data->estado_pago) ? $conn->real_escape_string($data->estado_pago) : null;
$metodo_pago = isset($data->metodo_pago) ? $conn->real_escape_string($data->metodo_pago) : null;

// Validar que al menos un campo esté presente para actualizar
if ($estado_pago === null && $metodo_pago === null) {
    echo json_encode([
        "success" => false, 
        "message" => "No se enviaron campos para actualizar. Debe proporcionar estado_pago y/o metodo_pago"
    ]);
    exit;
}

// Validar estado si viene presente
$estados_validos = ['pagado', 'pendiente', 'cancelado'];
if ($estado_pago !== null && !in_array($estado_pago, $estados_validos)) {
    echo json_encode([
        "success" => false, 
        "message" => "Estado no válido. Los valores permitidos son: pagado, pendiente, cancelado"
    ]);
    exit;
}

// Validar método de pago si viene presente - ACTUALIZADO
$metodos_validos = ['efectivo', 'tarjeta', 'mixto'];
if ($metodo_pago !== null && !in_array($metodo_pago, $metodos_validos)) {
    echo json_encode([
        "success" => false, 
        "message" => "Método de pago no válido. Los valores permitidos son: efectivo, tarjeta, mixto"
    ]);
    exit;
}

try {
    // Obtener datos actuales de la venta
    $sql_select = "SELECT estado_pago, metodo_pago FROM ventas WHERE id = ?";
    $stmt_select = $conn->prepare($sql_select);
    $stmt_select->bind_param("i", $id_venta);
    $stmt_select->execute();
    $result = $stmt_select->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            "success" => false, 
            "message" => "Venta no encontrada"
        ]);
        exit;
    }
    
    $venta = $result->fetch_assoc();
    $estado_anterior = $venta['estado_pago'];
    $metodo_anterior = $venta['metodo_pago'];
    
    // Construir la consulta SQL dinámicamente según los campos a actualizar
    $campos_actualizar = [];
    $tipos = "";
    $valores = [];
    
    if ($estado_pago !== null) {
        $campos_actualizar[] = "estado_pago = ?";
        $tipos .= "s";
        $valores[] = $estado_pago;
    }
    
    if ($metodo_pago !== null) {
        $campos_actualizar[] = "metodo_pago = ?";
        $tipos .= "s";
        $valores[] = $metodo_pago;
    }
    
    // Agregar el ID al final de los valores
    $tipos .= "i";
    $valores[] = $id_venta;
    
    // Verificar si realmente hay cambios
    $hay_cambios = false;
    $cambios_realizados = [];
    
    if ($estado_pago !== null && $estado_pago !== $estado_anterior) {
        $hay_cambios = true;
        $cambios_realizados[] = "estado: '$estado_anterior' → '$estado_pago'";
    }
    
    if ($metodo_pago !== null && $metodo_pago !== $metodo_anterior) {
        $hay_cambios = true;
        $cambios_realizados[] = "método: '" . ($metodo_anterior ?: 'vacío') . "' → '$metodo_pago'";
    }
    
    // Si no hay cambios, responder sin actualizar
    if (!$hay_cambios) {
        $mensaje = "No se realizaron cambios. ";
        if ($estado_pago !== null && $metodo_pago !== null) {
            $mensaje .= "El estado ya es '$estado_pago' y el método ya es '$metodo_pago'";
        } elseif ($estado_pago !== null) {
            $mensaje .= "El estado ya es '$estado_pago'";
        } elseif ($metodo_pago !== null) {
            $mensaje .= "El método de pago ya es '$metodo_pago'";
        }
        
        echo json_encode([
            "success" => true,
            "message" => $mensaje,
            "data" => [
                "id" => $id_venta,
                "estado_anterior" => $estado_anterior,
                "estado_nuevo" => $estado_pago ?: $estado_anterior,
                "metodo_anterior" => $metodo_anterior,
                "metodo_nuevo" => $metodo_pago ?: $metodo_anterior,
                "cambios_realizados" => []
            ]
        ]);
        exit;
    }
    
    // Ejecutar la actualización
    $sql_update = "UPDATE ventas SET " . implode(", ", $campos_actualizar) . " WHERE id = ?";
    $stmt_update = $conn->prepare($sql_update);
    
    // Crear array de parámetros para bind_param dinámico
    $params = array_merge([$tipos], $valores);
    
    // bind_param requiere pasar las variables por referencia
    $bind_params = [];
    foreach ($params as $key => $value) {
        $bind_params[$key] = &$params[$key];
    }
    
    call_user_func_array([$stmt_update, 'bind_param'], $bind_params);
    
    if ($stmt_update->execute()) {
        // Construir mensaje de éxito
        $mensaje = "Venta actualizada correctamente. ";
        if (count($cambios_realizados) > 0) {
            $mensaje .= "Cambios: " . implode(", ", $cambios_realizados);
        }
        
        echo json_encode([
            "success" => true,
            "message" => $mensaje,
            "data" => [
                "id" => $id_venta,
                "estado_anterior" => $estado_anterior,
                "estado_nuevo" => $estado_pago ?: $estado_anterior,
                "metodo_anterior" => $metodo_anterior,
                "metodo_nuevo" => $metodo_pago ?: $metodo_anterior,
                "cambios_realizados" => $cambios_realizados
            ]
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "message" => "Error al actualizar la venta: " . $stmt_update->error
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => "Error en el servidor: " . $e->getMessage()
    ]);
}

$conn->close();
?>