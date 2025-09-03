<?php
header('Content-Type: application/json');
include './db.php'; // adjust path if needed

if (isset($_GET['method_id'])) {
    $methodId = intval($_GET['method_id']);

    // Fetch the method from the database
    $sql = "SELECT * FROM methods WHERE method_id = $methodId";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $method = $result->fetch_assoc();
        echo json_encode($method);
    } else {
        // Return an error JSON if method not found
        echo json_encode(["error" => "Method not found"]);
    }
} else {
    // Return error if method_id not provided
    echo json_encode(["error" => "No method_id provided"]);
}
?>