<?php
require_once 'config.php';

// Buscar productos con más de 7 días
$sql = "
    SELECT p.*, DATEDIFF(CURDATE(), p.fecha_recibimiento) as dias
    FROM productos p
    WHERE p.activo = 1 
    AND DATEDIFF(CURDATE(), p.fecha_recibimiento) >= 7
    AND p.id NOT IN (SELECT producto_id FROM sobrantes WHERE estado != 'descartado')
";

$result = $conn->query($sql);
$procesados = 0;

while ($producto = $result->fetch_assoc()) {
    // Insertar como sobrante
    $tipo = ($producto['kilos'] > 0) ? 'verduras_frutas' : 'otro';
    $valor = ($tipo === 'verduras_frutas') ? 
        $producto['kilos'] * $producto['precio_venderK'] : 
        $producto['unidades'] * $producto['precio_venderD'];
    
    $sql_insert = "INSERT INTO sobrantes (producto_id, producto, tipo_producto, kilos, unidades, 
                    precio_kilos, precio_unidad, valor_total, fecha_recibimiento, dias_en_inventario, 
                    estado, motivo, usuario_id) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', 'Automático por días', 1)";
    
    $stmt = $conn->prepare($sql_insert);
    $stmt->bind_param("issdddddssi", 
        $producto['id'], $producto['producto'], $tipo, $producto['kilos'], $producto['unidades'],
        $producto['precio_kilos'], $producto['precio_unidad'], $valor, $producto['fecha_recibimiento'],
        $producto['dias']
    );
    $stmt->execute();
    $stmt->close();
    
    // Suspender producto
    $conn->query("UPDATE productos SET activo = 0 WHERE id = " . $producto['id']);
    $procesados++;
}

json_response([
    "success" => true,
    "message" => "Procesados $procesados productos como sobrantes",
    "total_procesados" => $procesados
]);
?>