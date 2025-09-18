<?php
header('Content-Type: application/json');
include './db.php';

if (!isset($_GET['method_id'])) {
  echo json_encode(["error" => "No method_id provided"]);
  exit;
}

$methodId = intval($_GET['method_id']);

$sql = "SELECT section_id, method_id, title, description, parent_section_id FROM method_sections WHERE method_id = $methodId ORDER BY COALESCE(parent_section_id, section_id), section_id";
$result = $conn->query($sql);

$rows = [];
while ($row = $result->fetch_assoc()) {
  $rows[] = $row;
}

$byId = [];
foreach ($rows as $r) {
  $r['children'] = [];
  $byId[$r['section_id']] = $r;
}

$roots = [];
foreach ($byId as $id => $node) {
  if (!empty($node['parent_section_id'])) {
    $parentId = intval($node['parent_section_id']);
    if (isset($byId[$parentId])) {
      $byId[$parentId]['children'][] = &$byId[$id];
    } else {
      $roots[] = &$byId[$id];
    }
  } else {
    $roots[] = &$byId[$id];
  }
}

echo json_encode($roots);
?>


