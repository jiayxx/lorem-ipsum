<?php
header('Content-Type: application/json');
include './db.php'; // adjust path if needed

if (isset($_GET['id'])) {
    $stageId = intval($_GET['id']);

    // ✅ Only fetch methods linked to this stage
    $sql = "
        SELECT m.method_id, m.title, m.short_desc, m.long_desc, m.resources
        FROM methods m
        INNER JOIN method_stage ms ON m.method_id = ms.method_id
        WHERE ms.stage_id = $stageId
    ";
    $result = $conn->query($sql);

    $methods = [];
    while ($row = $result->fetch_assoc()) {
        $methods[] = $row;
    }

    echo json_encode($methods);

} else {
    // ✅ Optional: fetch all methods if no stage is specified
    $sql = "SELECT * FROM methods";
    $result = $conn->query($sql);

    $methods = [];
    while ($row = $result->fetch_assoc()) {
        $methods[] = $row;
    }

    echo json_encode($methods);
}
?>