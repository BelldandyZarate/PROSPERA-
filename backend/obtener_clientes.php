<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Incluir configuración de base de datos
require_once 'config.php';

// Obtener parámetros (eliminamos página y límite)
$busqueda = isset($_GET['busqueda']) ? $_GET['busqueda'] : '';
$estado = isset($_GET['estado']) ? $_GET['estado'] : '';
$ciudad = isset($_GET['ciudad']) ? $_GET['ciudad'] : '';
$tipo_pago = isset($_GET['tipo_pago']) ? $_GET['tipo_pago'] : '';
$medio = isset($_GET['medio']) ? $_GET['medio'] : '';

try {
    // Verificar si la conexión se estableció correctamente
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }
    
    // Construir consulta base SIN paginación
    $query = "SELECT * FROM cliente WHERE 1=1";
    $params = [];
    $types = "";
    
    // Aplicar filtros
    if (!empty($busqueda)) {
        $query .= " AND (nombre_completo LIKE ? OR curp LIKE ? OR id_votante LIKE ? OR correo LIKE ? OR telefono LIKE ?)";
        $busqueda_param = "%$busqueda%";
        $params[] = $busqueda_param;
        $params[] = $busqueda_param;
        $params[] = $busqueda_param;
        $params[] = $busqueda_param;
        $params[] = $busqueda_param;
        $types .= "sssss";
    }
    
    if (!empty($estado)) {
        $query .= " AND estado = ?";
        $params[] = $estado;
        $types .= "s";
    }
    
    if (!empty($ciudad)) {
        $query .= " AND ciudad = ?";
        $params[] = $ciudad;
        $types .= "s";
    }
    
    if (!empty($tipo_pago)) {
        $query .= " AND tipo_pago = ?";
        $params[] = $tipo_pago;
        $types .= "s";
    }
    
    if (!empty($medio)) {
        $query .= " AND medio = ?";
        $params[] = $medio;
        $types .= "s";
    }
    
    // Ordenar SIN LIMIT ni OFFSET
    $query .= " ORDER BY fecha_registro DESC";
    
    // Preparar y ejecutar consulta
    $stmt = $conn->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }
    
    // Bind de parámetros si hay
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $clientes = [];
    while ($row = $result->fetch_assoc()) {
        $clientes[] = $row;
    }
    
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $clientes,
        "total_registros" => count($clientes)
    ]);
    
    // Cerrar conexión
    $stmt->close();
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Error: " . $e->getMessage()
    ]);
}
?>