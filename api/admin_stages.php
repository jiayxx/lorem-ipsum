<?php
/* 
==========================================
DESIGN THINKING BOOKLET - STAGES API
==========================================

This API manages the design thinking stages (Empathize, Define, Ideate, Prototype, Test).
Stages are the main categories that organize methods in the booklet.

API ENDPOINTS:
- GET: Retrieve all stages with their colors and descriptions
- POST: Create a new design thinking stage
- PUT: Update stage information (name, description, color)
- DELETE: Remove a stage (with 24-hour undo functionality)

KEY FEATURES:
- Color management for each stage (used in booklet mode indicators)
- Stage descriptions and metadata
- Undo system for deleted stages
- Integration with method organization

TEACHER NOTE: This API manages the main design thinking framework.
The stages appear as colored modules in the sidebar of both admin and main app.
*/

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

include './db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $id = isset($_GET['stage_id']) ? intval($_GET['stage_id']) : null;
  if ($id) {
    $res = $conn->query("SELECT * FROM stages WHERE stage_id = $id");
    echo json_encode($res && $res->num_rows ? $res->fetch_assoc() : null);
  } else {
    $rows = [];
    $res = $conn->query("SELECT * FROM stages ORDER BY position ASC, stage_id ASC");
    while ($r = $res->fetch_assoc()) { $rows[] = $r; }
    echo json_encode($rows);
  }
  exit;
}

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
  $position = isset($body['position']) ? "position=".intval($body['position']) : null;
  $parts = array_values(array_filter([$name,$desc,$color,$position], fn($v)=>$v!==null));
  if (!$parts) { echo json_encode(["updated"=>0]); exit; }
  $sql = "UPDATE stages SET ".implode(',', $parts)." WHERE stage_id=$id";
  if ($conn->query($sql)) { echo json_encode(["updated"=>$conn->affected_rows]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

if ($method === 'DELETE') {
  $id = isset($_GET['stage_id']) ? intval($_GET['stage_id']) : intval($body['stage_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>"stage_id required"]); exit; }
  
  $conn->begin_transaction();
  
  try {
    $conn->query("DELETE FROM method_stage WHERE stage_id=$id");
    
    $conn->query("DELETE FROM method_modes WHERE mode_name IN (SELECT name FROM stages WHERE stage_id=$id)");
    
    if ($conn->query("DELETE FROM stages WHERE stage_id=$id")) {
      $conn->commit();
      echo json_encode(["deleted"=>1]);
    } else {
      throw new Exception($conn->error);
    }
  } catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["error"=>$e->getMessage()]);
  }
  exit;
}

http_response_code(405);
echo json_encode(["error"=>"Method not allowed"]);
?>


