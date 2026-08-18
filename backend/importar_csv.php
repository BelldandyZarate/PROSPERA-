<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include "config.php";

// Verificar si se recibió un archivo
if (!isset($_FILES['archivo']) || $_FILES['archivo']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "No se recibió el archivo o hubo un error en la subida"]);
    exit;
}

// Validar tipo de archivo
$fileType = pathinfo($_FILES['archivo']['name'], PATHINFO_EXTENSION);
if (strtolower($fileType) !== 'csv') {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Solo se permiten archivos CSV"]);
    exit;
}

try {
    $conn->begin_transaction();

    $archivo = fopen($_FILES['archivo']['tmp_name'], "r");
    if ($archivo === false) {
        throw new Exception("No se pudo abrir el archivo");
    }

    // Saltar encabezado si existe
    fgetcsv($archivo);

    while (($data = fgetcsv($archivo, 1000, ",")) !== FALSE) {
        if (count($data) < 15) continue; // Saltar filas incompletas

        $stmt = $conn->prepare("INSERT INTO codigos_postales (
            d_codigo, d_asenta, d_tipo_asenta, D_mnpio, d_estado,
            d_ciudad, d_CP, c_estado, c_oficina, c_CP,
            c_tipo_asenta, c_mnpio, id_asenta_cpcons, d_zona, c_cve_ciudad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        if (!$stmt) {
            throw new Exception("Error en la preparación: " . $conn->error);
        }

        $stmt->bind_param(
            "sssssssssssssss",
            $data[0], $data[1], $data[2], $data[3], $data[4],
            $data[5], $data[6], $data[7], $data[8], $data[9],
            $data[10], $data[11], $data[12], $data[13], $data[14]
        );

        if (!$stmt->execute()) {
            throw new Exception("Error en la ejecución: " . $stmt->error);
        }
    }

    $conn->commit();
    fclose($archivo);
    echo json_encode(["success" => true, "message" => "Datos importados correctamente"]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>