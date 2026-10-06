<?php
// 1. ALLOW GLOBAL CROSS-ORIGIN REQUESTS (CORS) WITH THE EXPLICIT NGROK HEADER
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

// 2. FORCE DATA TO RETURN AS JSON ONLY
header("Content-Type: application/json; charset=UTF-8");

// 3. IMMEDIATELY INTERCEPT AND CLEAR BROWSER PRE-FLIGHT (OPTIONS) CHECKS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once __DIR__ . '/../config/db_connect.php';

try {
    // Silently prunes out any logs older than 6 months from the current time
    $pruneQuery = "DELETE FROM system_activity_audit WHERE timestamp < NOW() - INTERVAL 6 MONTH";
    $pdo->exec($pruneQuery);

    // Select the freshly pruned database records to return to your dashboard
    $query = "SELECT a.id, a.user_id, a.action_type, a.description, a.timestamp, u.username 
          FROM system_activity_audit a 
          LEFT JOIN users u ON a.user_id = u.id 
          ORDER BY a.id DESC";
    $stmt = $pdo->query($query);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["status" => "success", "data" => $logs]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Audit query execution exception: " . $e->getMessage()]);
}
?>