<?php
/* 
==========================================
DESIGN THINKING BOOKLET - METHODS API
==========================================

This API handles all CRUD operations for methods in the Design Thinking Booklet.
Methods are the individual tools/techniques within each design thinking stage.

API ENDPOINTS:
- GET: Retrieve all methods or a specific method by ID
- POST: Create a new method with image upload support
- PUT: Update an existing method (including drag & drop reordering)
- DELETE: Remove a method from the system

KEY FEATURES:
- Image upload with Base64 encoding for method illustrations
- Drag & drop position management for method ordering
- Mode association (links methods to design thinking stages)
- Hierarchical section support for detailed method descriptions

TEACHER NOTE: This API manages all the methods that appear in the booklet.
When you create/edit methods in admin, this API handles the data.
*/

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
include './db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  $id = isset($_GET['method_id']) ? intval($_GET['method_id']) : null;
  $stageId = isset($_GET['stage_id']) ? intval($_GET['stage_id']) : null;
  if ($id) {
    $res = $conn->query("SELECT * FROM methods WHERE method_id=$id");
    if ($res && $res->num_rows) {
      $method = $res->fetch_assoc();
      
      $modesRes = $conn->query("SELECT mm.mode_name, m.color_code FROM method_modes mm 
                                JOIN modes m ON mm.mode_name = m.name 
                                WHERE mm.method_id=$id");
      $modes = [];
      $modeColors = [];
      if ($modesRes) {
        while ($modeRow = $modesRes->fetch_assoc()) {
          $modes[] = $modeRow['mode_name'];
          $modeColors[$modeRow['mode_name']] = $modeRow['color_code'];
        }
      }
      $method['modes'] = $modes;
      $method['mode_colors'] = $modeColors;
      
      echo json_encode($method);
    } else {
      echo json_encode(null);
    }
  } else if ($stageId) {
    $rows = [];
    $sql = "SELECT m.* FROM methods m INNER JOIN method_stage ms ON m.method_id=ms.method_id WHERE ms.stage_id=$stageId ORDER BY m.position ASC, m.method_id ASC";
    $res = $conn->query($sql);
    while ($r=$res->fetch_assoc()) $rows[]=$r;
    echo json_encode($rows);
  } else {
    $rows = [];
    $res = $conn->query("SELECT * FROM methods ORDER BY method_id");
    while ($r=$res->fetch_assoc()) $rows[]=$r;
    echo json_encode($rows);
  }
  exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];

if ($method === 'POST') {
  $title = $conn->real_escape_string($body['title'] ?? '');

  if ($title==='') { http_response_code(400); echo json_encode(["error"=>'title required']); exit; }
  $short = $conn->real_escape_string($body['short_desc'] ?? '');
  $long = $conn->real_escape_string($body['long_desc'] ?? '');
  $resources = $conn->real_escape_string($body['resources'] ?? '');
  $imageUrl = $conn->real_escape_string($body['image_url'] ?? '');
  $sql = "INSERT INTO methods (title, short_desc, long_desc, resources, image_url) VALUES ('$title','$short','$long','$resources','$imageUrl')";
  if (!$conn->query($sql)) { http_response_code(500); echo json_encode(["error"=>$conn->error]); exit; }
  $methodId = $conn->insert_id;
  
  if (!empty($body['stage_id'])) {
    $stageId = intval($body['stage_id']);
    $conn->query("INSERT INTO method_stage (method_id, stage_id) VALUES ($methodId, $stageId)");
  }
  
  if (!empty($body['modes']) && is_array($body['modes'])) {
    foreach ($body['modes'] as $mode) {
      $modeName = $conn->real_escape_string($mode);
      $conn->query("INSERT INTO method_modes (method_id, mode_name) VALUES ($methodId, '$modeName')");
    }
  }
  
  echo json_encode(["method_id"=>$methodId]);
  exit;
}

if ($method === 'PUT') {
  $id = intval($body['method_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>'method_id required']); exit; }
  $parts = [];
  foreach (["title","short_desc","long_desc","resources","image_url","position"] as $col) {
    if (array_key_exists($col, $body)) {
      $parts[] = $col."='".$conn->real_escape_string($body[$col])."'";
    }
  }
  if ($parts) {
    $sql = "UPDATE methods SET ".implode(',', $parts)." WHERE method_id=$id";
    if (!$conn->query($sql)) { http_response_code(500); echo json_encode(["error"=>$conn->error]); exit; }
  }
  if (array_key_exists('stage_id', $body)) {
    $stageId = intval($body['stage_id']);
    $conn->query("DELETE FROM method_stage WHERE method_id=$id");
    if ($stageId) $conn->query("INSERT INTO method_stage (method_id, stage_id) VALUES ($id, $stageId)");
  }
  
  if (array_key_exists('modes', $body)) {
    $conn->query("DELETE FROM method_modes WHERE method_id=$id");
    if (is_array($body['modes'])) {
      foreach ($body['modes'] as $mode) {
        $modeName = $conn->real_escape_string($mode);
        $conn->query("INSERT INTO method_modes (method_id, mode_name) VALUES ($id, '$modeName')");
      }
    }
  }
  
  echo json_encode(["updated"=>1]);
  exit;
}

if ($method === 'DELETE') {
  $id = isset($_GET['method_id']) ? intval($_GET['method_id']) : intval($body['method_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>'method_id required']); exit; }
  
  $conn->begin_transaction();
  
  try {
    $conn->query("DELETE FROM method_sections WHERE method_id=$id");
    
    $conn->query("DELETE FROM method_modes WHERE method_id=$id");
    
    $conn->query("DELETE FROM method_stage WHERE method_id=$id");
    
    if ($conn->query("DELETE FROM methods WHERE method_id=$id")) {
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
echo json_encode(["error"=>'Method not allowed']);
?>


