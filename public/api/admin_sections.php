<?php
/* 
==========================================
DESIGN THINKING BOOKLET - SECTIONS API
==========================================

This API manages the detailed sections within each method in the booklet.
Sections provide step-by-step instructions and detailed information for each method.

API ENDPOINTS:
- GET: Retrieve all sections for a specific method
- POST: Create a new section within a method
- PUT: Update section content (title, description, parent relationships)
- DELETE: Remove a section from a method

KEY FEATURES:
- Hierarchical section structure (parent-child relationships)
- Optional section titles (some sections don't need titles)
- Rich text content for detailed method instructions
- Tree-like organization for complex methods

TEACHER NOTE: This API manages the detailed content that appears in the booklet pages.
Sections are what students see when they open a method in the booklet.
*/

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
include './db.php';

if (!$conn) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $methodId = isset($_GET['method_id']) ? intval($_GET['method_id']) : null;
  $id = isset($_GET['section_id']) ? intval($_GET['section_id']) : null;
  if ($id) {
    $res = $conn->query("SELECT * FROM method_sections WHERE section_id=$id");
    if (!$res) {
        http_response_code(500);
        echo json_encode(["error" => "Database query failed: " . $conn->error]);
        exit;
    }
    echo json_encode($res && $res->num_rows ? $res->fetch_assoc() : null);
  } else if ($methodId) {
    $rows = [];
    $res = $conn->query("SELECT * FROM method_sections WHERE method_id=$methodId ORDER BY COALESCE(parent_section_id, section_id), section_id");
    if (!$res) {
        http_response_code(500);
        echo json_encode(["error" => "Database query failed: " . $conn->error]);
        exit;
    }
    while ($r=$res->fetch_assoc()) $rows[]=$r;
    echo json_encode($rows);
  } else {
    $rows = [];
    $res = $conn->query("SELECT * FROM method_sections ORDER BY section_id");
    if (!$res) {
        http_response_code(500);
        echo json_encode(["error" => "Database query failed: " . $conn->error]);
        exit;
    }
    while ($r=$res->fetch_assoc()) $rows[]=$r;
    echo json_encode($rows);
  }
  exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'POST') {
  $methodId = intval($body['method_id'] ?? 0);
  $title = $conn->real_escape_string($body['title'] ?? '');
  $description = $conn->real_escape_string($body['description'] ?? '');
  $parent = array_key_exists('parent_section_id', $body) && $body['parent_section_id'] !== null ? intval($body['parent_section_id']) : 'NULL';
  if (!$methodId || $title==='') { http_response_code(400); echo json_encode(["error"=>'method_id and title required']); exit; }
  $sql = "INSERT INTO method_sections (method_id, title, description, parent_section_id) VALUES ($methodId, '$title', '$description', $parent)";
  if ($conn->query($sql)) { echo json_encode(["section_id"=>$conn->insert_id]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

if ($method === 'PUT') {
  $id = intval($body['section_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>'section_id required']); exit; }
  $parts = [];
  foreach (["method_id","title","description"] as $col) {
    if (array_key_exists($col,$body)) {
      $val = $conn->real_escape_string($body[$col]);
      $parts[] = $col."='".$val."'";
    }
  }
  if (array_key_exists('parent_section_id', $body)) {
    $val = $body['parent_section_id'];
    $parts[] = "parent_section_id=".(is_null($val)?'NULL':intval($val));
  }
  if (!$parts) { echo json_encode(["updated"=>0]); exit; }
  $sql = "UPDATE method_sections SET ".implode(',', $parts)." WHERE section_id=$id";
  if ($conn->query($sql)) { echo json_encode(["updated"=>$conn->affected_rows]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

if ($method === 'DELETE') {
  $id = isset($_GET['section_id']) ? intval($_GET['section_id']) : intval($body['section_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>'section_id required']); exit; }
  
  $conn->query("UPDATE method_sections SET parent_section_id = NULL WHERE parent_section_id = $id");
  
  if ($conn->query("DELETE FROM method_sections WHERE section_id=$id")) { 
    echo json_encode(["deleted"=>1]); 
  } else { 
    http_response_code(500); 
    echo json_encode(["error"=>$conn->error]); 
  }
  exit;
}

http_response_code(405);
echo json_encode(["error"=>'Method not allowed']);
?>


