<?php
header('Content-Type: application/json');
include './db.php'; // your db connection

$sql = "SELECT * FROM stages";
$result = $conn->query($sql);

$stages = [];
while ($row = $result->fetch_assoc()) {
    $stages[] = $row;
}

echo json_encode($stages);
?>