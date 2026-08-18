<?php
// productos.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

include 'config.php';

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión a la base de datos: " . $conn->connect_error]);
    exit;
}

// Consulta a la tabla productos - SOLO productos ACTIVOS
$sql = "SELECT 
            id, 
            producto, 
            kilos, 
            precio_kilos, 
            precio_venderK, 
            unidades, 
            precio_unidad, 
            precio_venderD,
            fecha_recibimiento,
            activo
        FROM productos 
        WHERE (kilos > 0 OR unidades > 0) 
        AND activo = 1  -- SOLO PRODUCTOS ACTIVOS
        ORDER BY producto";

$result = $conn->query($sql);

$productos = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $row['nombre_producto'] = $row['producto']; // Compatibilidad
        $row['disponible_kilos'] = ($row['kilos'] > 0 && $row['precio_venderK'] > 0);
        $row['disponible_unidades'] = ($row['unidades'] > 0 && $row['precio_venderD'] > 0);
        $productos[] = $row;
    }
}

echo json_encode($productos);
$conn->close();
?>