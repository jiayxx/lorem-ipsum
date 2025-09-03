<?php
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
    echo json_encode($res && $res->num_rows ? $res->fetch_assoc() : null);
  } else if ($stageId) {
    $rows = [];
    $sql = "SELECT m.* FROM methods m INNER JOIN method_stage ms ON m.method_id=ms.method_id WHERE ms.stage_id=$stageId ORDER BY m.method_id";
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
  $sql = "INSERT INTO methods (title, short_desc, long_desc, resources) VALUES ('$title','$short','$long','$resources')";
  if (!$conn->query($sql)) { http_response_code(500); echo json_encode(["error"=>$conn->error]); exit; }
  $methodId = $conn->insert_id;
  // Optional: link to stage
  if (!empty($body['stage_id'])) {
    $stageId = intval($body['stage_id']);
    $conn->query("INSERT INTO method_stage (method_id, stage_id) VALUES ($methodId, $stageId)");
  }
  echo json_encode(["method_id"=>$methodId]);
  exit;
}

if ($method === 'PUT') {
  $id = intval($body['method_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>'method_id required']); exit; }
  $parts = [];
  foreach (["title","short_desc","long_desc","resources"] as $col) {
    if (array_key_exists($col, $body)) {
      $parts[] = $col."='".$conn->real_escape_string($body[$col])."'";
    }
  }
  if ($parts) {
    $sql = "UPDATE methods SET ".implode(',', $parts)." WHERE method_id=$id";
    if (!$conn->query($sql)) { http_response_code(500); echo json_encode(["error"=>$conn->error]); exit; }
  }
  // Update stage mapping if provided
  if (array_key_exists('stage_id', $body)) {
    $stageId = intval($body['stage_id']);
    $conn->query("DELETE FROM method_stage WHERE method_id=$id");
    if ($stageId) $conn->query("INSERT INTO method_stage (method_id, stage_id) VALUES ($id, $stageId)");
  }
  echo json_encode(["updated"=>1]);
  exit;
}

if ($method === 'DELETE') {
  $id = isset($_GET['method_id']) ? intval($_GET['method_id']) : intval($body['method_id'] ?? 0);
  if (!$id) { http_response_code(400); echo json_encode(["error"=>'method_id required']); exit; }
  if ($conn->query("DELETE FROM methods WHERE method_id=$id")) { echo json_encode(["deleted"=>1]); } else { http_response_code(500); echo json_encode(["error"=>$conn->error]); }
  exit;
}

http_response_code(405);
echo json_encode(["error"=>'Method not allowed']);
?>


