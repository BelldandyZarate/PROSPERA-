<?php
header('Content-Type: application/json');
include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (
  isset($data['venta_id']) &&
  isset($data['cliente']) &&
  isset($data['producto']) &&
  isset($data['unidades']) &&
  isset($data['metodo_pago']) &&
  isset($data['precio_total']) &&
  isset($data['fecha_venta'])
) {
  $id = intval($data['venta_id']);
  $cliente = $conn->real_escape_string($data['cliente']);
  $producto = $conn->real_escape_string($data['producto']);
  $unidades = intval($data['unidades']);
  $metodo_pago = $conn->real_escape_string($data['metodo_pago']);
  $numero_tarjeta = isset($data['numero_tarjeta']) ? $conn->real_escape_string($data['numero_tarjeta']) : "";
  $precio_total = floatval($data['precio_total']);
  $fecha_venta = $conn->real_escape_string($data['fecha_venta']);

  // Primero, actualizar tabla ventas (cliente_id y producto_id son relaciones, pero si usas texto, actualiza aquí)
  // OJO: Si cliente y producto son IDs, deberías obtener esos IDs y actualizar.
  // Aquí actualizo solo campos directos en ventas:
  $sql_ventas = "UPDATE ventas SET 
                    metodo_pago='$metodo_pago',
                    numero_tarjeta='$numero_tarjeta',
                    precio_total=$precio_total,
                    fecha_venta='$fecha_venta'
                 WHERE id=$id";

  if (!$conn->query($sql_ventas)) {
    echo json_encode(["success" => false, "error" => "Error al actualizar ventas: " . $conn->error]);
    exit;
  }

  // Ahora actualizar detalle_venta (unidades y producto)
  // Aquí el producto también es nombre, si tienes IDs debes ajustar para actualizar producto_id
  // Supongo que detalle_venta tiene producto_id, necesitas obtenerlo por nombre producto:
  $sql_producto = "SELECT id FROM productos WHERE nombre_producto = '$producto' LIMIT 1";
  $result_producto = $conn->query($sql_producto);
  if ($result_producto && $result_producto->num_rows > 0) {
    $row_producto = $result_producto->fetch_assoc();
    $producto_id = intval($row_producto['id']);

    $sql_detalle = "UPDATE detalle_venta SET 
                      unidades=$unidades,
                      producto_id=$producto_id
                    WHERE venta_id=$id";

    if (!$conn->query($sql_detalle)) {
      echo json_encode(["success" => false, "error" => "Error al actualizar detalle_venta: " . $conn->error]);
      exit;
    }
  } else {
    echo json_encode(["success" => false, "error" => "Producto no encontrado"]);
    exit;
  }

  // Opcional: actualizar cliente_id si tienes lógica parecida (no está en el React, solo nombre cliente)
  // Si quieres actualizar cliente_id, necesitas buscar id del cliente por nombre y actualizar ventas.cliente_id

  echo json_encode(["success" => true]);

} else {
  echo json_encode(["success" => false, "error" => "Datos incompletos"]);
}
