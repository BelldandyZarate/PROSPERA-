<?php
header("Content-Type: application/json");

include 'config.php'; // La conexión a la base de datos está definida en config.php

// Verificar conexión
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Conexión fallida"]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_FILES["foto_cliente"]) && isset($_FILES["foto_ine"])) {
    // Recibir datos
    $curp = $_POST["curp"];
    $id_votante = $_POST["id_votante"];
    $nombre_completo = $_POST["nombre_completo"];
    $direccion = $_POST["direccion"];
    $codigo_postal = $_POST["codigo_postal"];
    $colonia = $_POST["colonia"];
    $estado = $_POST["estado"];
    $ciudad = $_POST["ciudad"];
    $correo = $_POST["correo"];
    $telefono = $_POST["telefono"];
    $notas = $_POST["notas"];
    $tipo_pago = $_POST["tipo_pago"];
    $medio = $_POST["medio"];
    $adultos = (int)$_POST["adultos"];
    $menores = (int)$_POST["menores"];
    $sugerencias = $_POST["sugerencias"];
    $padecimientos = $_POST["padecimientos"];
    $quien_padece = $_POST["quien_padece"];

    $codigo_barras = $curp; // Asignamos el CURP como texto del código de barras

    // Preparar carpeta
    $folderName = preg_replace('/[^a-zA-Z0-9-_]/', '_', $nombre_completo);
    $uploadDir = "upload/cliente/$folderName/";
    if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

    // Validar imágenes
    $validImageTypes = ['image/jpeg', 'image/png'];
    $foto_cliente_type = $_FILES["foto_cliente"]["type"];
    $foto_ine_type = $_FILES["foto_ine"]["type"];

    if (!in_array($foto_cliente_type, $validImageTypes) || !in_array($foto_ine_type, $validImageTypes)) {
        echo json_encode(["success" => false, "error" => "Las imágenes deben ser JPG o PNG"]);
        exit;
    }

    // Guardar imágenes
    $foto_cliente_path = $uploadDir . "foto_cliente.jpg";
    $foto_ine_path = $uploadDir . "foto_ine.jpg";

    if (!move_uploaded_file($_FILES["foto_cliente"]["tmp_name"], $foto_cliente_path) ||
        !move_uploaded_file($_FILES["foto_ine"]["tmp_name"], $foto_ine_path)) {
        echo json_encode(["success" => false, "error" => "Error al subir las imágenes"]);
        exit;
    }

    // Guardar imagen de código de barras
    if (isset($_FILES["barcode_img"])) {
        $barcode_img = $uploadDir . "barcode.png";
        if (!move_uploaded_file($_FILES["barcode_img"]["tmp_name"], $barcode_img)) {
            echo json_encode(["success" => false, "error" => "Error al guardar la imagen del código de barras"]);
            exit;
        }
    } else {
        echo json_encode(["success" => false, "error" => "No se recibió la imagen del código de barras"]);
        exit;
    }

    // Insertar en la base de datos
    $stmt = $conn->prepare("INSERT INTO cliente 
        (curp, id_votante, nombre_completo, direccion, codigo_postal, colonia, estado, ciudad, correo, telefono, notas, tipo_pago, medio, adultos, menores, sugerencias, padecimientos, quien_padece, foto_cliente, foto_ine, barcode_img, codigo_barras)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    if ($stmt === false) {
        echo json_encode(["success" => false, "error" => "Error en la preparación de la consulta"]);
        exit;
    }

    $stmt->bind_param("ssssssssssssiiisssssss", 
        $curp, $id_votante, $nombre_completo, $direccion, $codigo_postal, $colonia, $estado, $ciudad,
        $correo, $telefono, $notas, $tipo_pago, $medio, $adultos, $menores,
        $sugerencias, $padecimientos, $quien_padece,
        $foto_cliente_path, $foto_ine_path, $barcode_img, $codigo_barras
    );

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Cliente registrado correctamente"]);
    } else {
        echo json_encode(["success" => false, "error" => "Error al insertar en base de datos"]);
    }

    $stmt->close();
    $conn->close();

} else {
    echo json_encode(["success" => false, "error" => "Datos incompletos"]);
}
?>
