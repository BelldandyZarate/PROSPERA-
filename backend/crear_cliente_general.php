<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Crear cliente general automáticamente
    $nombre = "CLIENTE GENERAL (NO MIEMBRO)";
    $curp = "NO-MIEMBRO";
    $telefono = "0000000000";
    $email = "general@tienda.com";
    $direccion = "No especificada";
    $codigo_postal = "00000";
    
    try {
        // Verificar si ya existe
        $stmt = $conn->prepare("SELECT id FROM clientes WHERE curp = ? OR nombre_completo LIKE ?");
        $stmt->bind_param("ss", $curp, $nombre);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $cliente = $result->fetch_assoc();
            echo json_encode([
                'success' => true, 
                'id' => $cliente['id'], 
                'message' => 'Cliente general ya existe',
                'existente' => true
            ]);
        } else {
            // Crear nuevo cliente
            $stmt = $conn->prepare("INSERT INTO clientes (
                nombre_completo, 
                curp, 
                telefono, 
                correo, 
                direccion, 
                codigo_postal,
                fecha_registro
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())");
            
            $stmt->bind_param("ssssss", $nombre, $curp, $telefono, $email, $direccion, $codigo_postal);
            
            if ($stmt->execute()) {
                $id = $stmt->insert_id;
                echo json_encode([
                    'success' => true, 
                    'id' => $id, 
                    'message' => 'Cliente general creado exitosamente',
                    'existente' => false
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Error al crear cliente: ' . $stmt->error]);
            }
        }
        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
}

$conn->close();
?>