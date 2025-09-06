<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
include './db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $rows = [];
  $res = $conn->query("SELECT * FROM modes ORDER BY mode_id");
  while ($r=$res->fetch_assoc()) $rows[]=$r;
  echo json_encode($rows);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'PUT') {
  $name = $conn->real_escape_string($body['name'] ?? '');
  $colorCode = $conn->real_escape_string($body['color_code'] ?? '');
  
  if (!$name || !$colorCode) { 
    http_response_code(400); 
    echo json_encode(["error"=>'name and color_code required']); 
    exit; 
  }
  
  $sql = "UPDATE modes SET color_code='$colorCode' WHERE name='$name'";
  if (!$conn->query($sql)) { 
    http_response_code(500); 
    echo json_encode(["error"=>$conn->error]); 
    exit; 
  }
  
  echo json_encode(["updated"=>1]);
  exit;
}

http_response_code(405);
echo json_encode(["error"=>'Method not allowed']);
?>
