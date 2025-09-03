<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include './db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  // List all stages or single by id
  $id = isset($_GET['stage_id']) ? intval($_GET['stage_id']) : null;
  if ($id) {
    $res = $conn->query("SELECT * FROM stages WHERE stage_id = $id");
    echo json_encode($res && $res->num_rows ? $res->fetch_assoc() : null);
  } else {
    $rows = [];
    $res = $conn->query("SELECT * FROM stages ORDER BY stage_id ASC");
    while ($r = $res->fetch_assoc()) { $rows[] = $r; }
    echo json_encode($rows);
  }
  exit;
}

// Read JSON body
$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'POST') {
  $name = $conn->real_escape_string($body['name'] ?? '');
  $description = $conn->real_escape_string($body['description'] ?? '');
  $color = $conn->real_escape_string($body['color_code'] ?? null);
  if ($name === '') { http_response_code(400); echo json_encode(["error"=>"name required"]); exit; }
  $sql = "INSERT INTO stages (name, description, color_code) VALUES ('$name', '$description', " . ($color ? "'$color'" : "NULL") . ")";
  if ($conn->query($sql)) { echo json_encode(["stage_id"=>$conn->insert_id]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

if ($method === 'PUT') {
  $id = intval($body['stage_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>"stage_id required"]); exit; }
  $name = isset($body['name']) ? "name='".$conn->real_escape_string($body['name'])."'" : null;
  $desc = isset($body['description']) ? "description='".$conn->real_escape_string($body['description'])."'" : null;
  $color = array_key_exists('color_code',$body) ? "color_code=".(is_null($body['color_code'])?"NULL":"'".$conn->real_escape_string($body['color_code'])."'") : null;
  $parts = array_values(array_filter([$name,$desc,$color], fn($v)=>$v!==null));
  if (!$parts) { echo json_encode(["updated"=>0]); exit; }
  $sql = "UPDATE stages SET ".implode(',', $parts)." WHERE stage_id=$id";
  if ($conn->query($sql)) { echo json_encode(["updated"=>$conn->affected_rows]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

if ($method === 'DELETE') {
  $id = isset($_GET['stage_id']) ? intval($_GET['stage_id']) : intval($body['stage_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>"stage_id required"]); exit; }
  if ($conn->query("DELETE FROM stages WHERE stage_id=$id")) { echo json_encode(["deleted"=>1]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

http_response_code(405);
echo json_encode(["error"=>"Method not allowed"]);
?>


