<?php
header('Content-Type: application/json');
include './db.php'; // adjust path if needed

if (isset($_GET['method_id'])) {
    $methodId = intval($_GET['method_id']);

    $sql = "SELECT * FROM methods WHERE method_id = $methodId";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $method = $result->fetch_assoc();
        echo json_encode($method);
    } else {
        echo json_encode(["error" => "Method not found"]);
    }
} else {
    echo json_encode(["error" => "No method_id provided"]);
}
?>