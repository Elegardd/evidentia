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

// Only allow incoming POST submissions
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// Intercept the Axios JSON data stream payload
$inputData = json_decode(file_get_contents("php://input"), true);

$id     = isset($inputData['id']) ? intval($inputData['id']) : 0;
$status = isset($inputData['status']) ? trim($inputData['status']) : 'archived';

// Validate target ID presence
if (empty($id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing user transaction reference key."]);
    exit();
}

// Validate ENUM configuration boundaries
if (!in_array($status, ['active', 'suspended', 'archived'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid target lifecycle status state requested."]);
    exit();
}

try {
    // UPDATED: Dynamically modify query parameters based on target account lifecycle state status
    if ($status === 'archived') {
        // If archiving, log the exact unalterable timestamp into last_login_at column row tracking
        $lifecycleStmt = $pdo->prepare("UPDATE users SET account_status = :status, last_login_at = NOW() WHERE id = :id");
    } else {
        // If suspending or reactivating, leave the historical login tracking column entirely unaffected
        $lifecycleStmt = $pdo->prepare("UPDATE users SET account_status = :status WHERE id = :id");
    }

    $lifecycleStmt->execute([
        'status' => $status,
        'id'     => $id
    ]);

    http_response_code(200); // OK status
    echo json_encode([
        "status"  => "success",
        "message" => "Operator status updated to '{$status}' successfully."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database exception error: " . $e->getMessage()]);
    exit();
}
?>