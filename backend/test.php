<?php
// api/test.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

echo json_encode(array(
    "success" => true,
    "message" => "API funcionando correctamente",
    "timestamp" => date("Y-m-d H:i:s")
));
?>