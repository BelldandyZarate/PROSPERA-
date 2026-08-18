<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

include 'config.php';

try {
    // Consulta que incluye el campo activo
    $sql = "SELECT 
                id, 
                producto, 
                kilos, 
                precio_kilos, 
                precio_venderK, 
                unidades, 
                precio_unidad, 
                precio_venderD, 
                activo  // ← Agregar este campo
            FROM productos 
            ORDER BY producto ASC";
    
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }
    
    $productos = [];
    
    while ($row = $result->fetch_assoc()) {
        // Determinar tipo de producto para venta
        if ($row['kilos'] > 0 && $row['precio_venderK'] > 0) {
            $row['tipo_venta'] = 'kilos';
            $row['cantidad_disponible'] = $row['kilos'];
            $row['precio_venta'] = $row['precio_venderK'];
        } elseif ($row['unidades'] > 0 && $row['precio_venderD'] > 0) {
            $row['tipo_venta'] = 'unidades';
            $row['cantidad_disponible'] = $row['unidades'];
            $row['precio_venta'] = $row['precio_venderD'];
        } else {
            continue; // Saltar productos sin stock o precio
        }
        
        $productos[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $productos,
        "total" => count($productos)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}

$conn->close();
?>