<?php
// api/obtener_venta_por_id.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
        "message" => "Error de conexión: " . ($conn->connect_error ?? "No hay conexión")
    ]);
    exit;
}

if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode(["success" => false, "message" => "ID no especificado"]);
    exit;
}

$id_venta = intval($_GET['id']);

try {
    // Obtener datos de la venta con información de cliente y producto
    $sql = "SELECT 
                v.id,
                v.folio,
                v.fecha_venta,
                v.estado_pago,
                v.metodo_pago,
                v.total,
                v.cantidad,
                v.precio_unitario,
                v.tipo_venta,
                v.cliente_id,
                v.producto_id,
                c.nombre_completo AS cliente_nombre,
                c.telefono AS cliente_telefono,
                c.correo AS cliente_correo,
                c.direccion AS cliente_direccion,
                c.colonia AS cliente_colonia,
                c.ciudad AS cliente_ciudad,
                c.estado AS cliente_estado,
                p.producto AS producto_nombre,
                p.tipo_producto,
                CASE 
                    WHEN v.tipo_venta = 'kilos' THEN 
                        CASE 
                            WHEN p.tipo_producto = 'verduras_frutas' THEN 'kg'
                            ELSE 'kg'
                        END
                    ELSE 'unid'
                END as unidad_medida
            FROM ventas v
            LEFT JOIN cliente c ON v.cliente_id = c.id
            LEFT JOIN productos p ON v.producto_id = p.id
            WHERE v.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $id_venta);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Venta no encontrada"]);
        exit;
    }
    
    $row = $result->fetch_assoc();
    
    // Calcular precio_total (cantidad * precio_unitario)
    $precio_total = floatval($row['cantidad']) * floatval($row['precio_unitario']);
    
    // Construir dirección completa
    $direccion_completa = trim(
        ($row['cliente_direccion'] ?? '') . 
        ($row['cliente_colonia'] ? ', Col. ' . $row['cliente_colonia'] : '') . 
        ($row['cliente_ciudad'] ? ', ' . $row['cliente_ciudad'] : '') . 
        ($row['cliente_estado'] ? ', ' . $row['cliente_estado'] : '')
    );
    
    if (empty($direccion_completa)) {
        $direccion_completa = "No registrada";
    }
    
    // Determinar el nombre del producto según el tipo
    $nombre_producto = $row['producto_nombre'] ?? "Producto no especificado";
    
    // Construir objeto venta
    $venta_data = [
        "id" => intval($row['id']),
        "folio" => $row['folio'],
        "fecha_venta" => $row['fecha_venta'],
        "fecha_venta_formateada" => date("d/m/Y H:i", strtotime($row['fecha_venta'])),
        "cliente" => [
            "id" => intval($row['cliente_id']),
            "nombre" => $row['cliente_nombre'] ?? "Cliente no especificado",
            "telefono" => $row['cliente_telefono'] ?? "No registrado",
            "email" => $row['cliente_correo'] ?? "No registrado",
            "direccion" => $direccion_completa
        ],
        "estado_pago" => $row['estado_pago'] ?? "pendiente",
        "metodo_pago" => $row['metodo_pago'] ?? "",
        "total_venta" => floatval($row['total']),
        "total_productos" => 1, // Cada venta tiene un solo producto
        "detalles" => [
            [
                "nombre_producto" => $nombre_producto,
                "cantidad" => floatval($row['cantidad']),
                "precio_unitario" => floatval($row['precio_unitario']),
                "precio_total" => $precio_total,
                "tipo_venta" => $row['tipo_venta'],
                "unidad_medida" => $row['unidad_medida']
            ]
        ]
    ];
    
    // Formatear respuesta
    $response = [
        "success" => true,
        "venta" => $venta_data
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false, 
        "message" => "Error: " . $e->getMessage()
    ]);
}

$conn->close();
?>