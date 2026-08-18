<?php
header("Content-Type: application/json");

include 'config.php';

if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Conexión fallida"]);
    exit;
}

// Leer datos JSON del cuerpo de la solicitud
$data = json_decode(file_get_contents("php://input"), true);

if ($_SERVER["REQUEST_METHOD"] == "POST" && $data) {
    $producto = $data["producto"] ?? '';
    $tipo_producto = $data["tipo_producto"] ?? 'verduras_frutas'; // 'verduras_frutas' o 'otro'
    $fecha_recibimiento = $data["fecha_recibimiento"] ?? '';
    $observaciones = $data["observaciones"] ?? ''; // Nuevo campo
    
    // Campos condicionales según tipo de producto
    if ($tipo_producto === 'verduras_frutas') {
        $kilos = $data["kilos"] ?? '';
        $precio_kilos = $data["precio_kilos"] ?? '';
        $precio_venderK = $data["precio_venderK"] ?? '';
        $unidades = 0;
        $precio_unidad = 0;
        $precio_venderD = 0;
        
        // Validar campos específicos para verduras/frutas
        if (!$kilos || !$precio_kilos || !$precio_venderK) {
            echo json_encode(["success" => false, "error" => "Faltan datos del producto (kilos y precios)"]);
            exit;
        }
        
        // Validar tipos de datos
        if (!is_numeric($kilos) || !is_numeric($precio_kilos) || !is_numeric($precio_venderK)) {
            echo json_encode(["success" => false, "error" => "Datos numéricos inválidos para kilos y precios"]);
            exit;
        }
        
        // Convertir a tipos correctos
        $kilos = floatval($kilos);
        $precio_kilos = floatval($precio_kilos);
        $precio_venderK = floatval($precio_venderK);
        
    } else {
        // Para otros productos
        $unidades = $data["unidades"] ?? '';
        $precio_unidad = $data["precio_unidad"] ?? '';
        $precio_venderD = $data["precio_venderD"] ?? '';
        $kilos = 0;
        $precio_kilos = 0;
        $precio_venderK = 0;
        
        // Validar campos específicos para otros productos
        if (!$unidades || !$precio_unidad || !$precio_venderD) {
            echo json_encode(["success" => false, "error" => "Faltan datos del producto (unidades y precios)"]);
            exit;
        }
        
        // Validar tipos de datos
        if (!is_numeric($unidades) || !is_numeric($precio_unidad) || !is_numeric($precio_venderD)) {
            echo json_encode(["success" => false, "error" => "Datos numéricos inválidos para unidades y precios"]);
            exit;
        }
        
        // Convertir a tipos correctos
        $unidades = intval($unidades);
        $precio_unidad = floatval($precio_unidad);
        $precio_venderD = floatval($precio_venderD);
    }

    // Validar campos comunes
    if (!$producto || !$fecha_recibimiento) {
        echo json_encode(["success" => false, "error" => "Faltan datos básicos del producto"]);
        exit;
    }
    
    // Validar fecha
    if (!strtotime($fecha_recibimiento)) {
        echo json_encode(["success" => false, "error" => "Fecha de recibimiento inválida"]);
        exit;
    }

    // Preparar la consulta SQL con la nueva estructura (incluyendo observaciones)
    $stmt = $conn->prepare("INSERT INTO productos (
        producto, 
        kilos, 
        precio_kilos, 
        precio_venderK, 
        unidades, 
        precio_unidad, 
        precio_venderD, 
        fecha_recibimiento,
        tipo_producto,
        observaciones
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    if (!$stmt) {
        echo json_encode(["success" => false, "error" => "Error al preparar la consulta: " . $conn->error]);
        exit;
    }

    // Los tipos son: s (string), d (double), d (double), d (double), i (integer), d (double), d (double), s (string), s (string), s (string)
    $stmt->bind_param("sdddidisss", 
        $producto,          // string - nombre del producto
        $kilos,             // double - kilos
        $precio_kilos,      // double - precio por kilo
        $precio_venderK,    // double - precio de venta por kilo
        $unidades,          // integer - unidades
        $precio_unidad,     // double - precio por unidad
        $precio_venderD,    // double - precio de venta por unidad
        $fecha_recibimiento, // string - fecha
        $tipo_producto,     // string - tipo de producto
        $observaciones      // string - observaciones (nuevo campo)
    );

    if ($stmt->execute()) {
        echo json_encode([
            "success" => true, 
            "message" => "Producto registrado correctamente",
            "id" => $stmt->insert_id,
            "tipo_producto" => $tipo_producto,
            "observaciones" => $observaciones
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al registrar el producto: " . $stmt->error]);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(["success" => false, "error" => "Método no permitido o datos inválidos"]);
}
?>