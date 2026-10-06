<?php
// 1. ALLOW GLOBAL CROSS-ORIGIN REQUESTS (CORS) WITH THE EXPLICIT NGROK HEADER
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

// 2. FORCE DATA TO RETURN AS JSON ONLY
header("Content-Type: application/json; charset=UTF-8");

// 3. IMMEDIATELY INTERCEPT AND CLEAR BROWSER PRE-FLIGHT (OPTIONS) CHECKS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 4. INCLUDE YOUR SYSTEM DATABASE SCRIPT USING CORRECT PATH
require_once __DIR__ . '/../config/db_connect.php';

try {
    // A. Core Summary Metrics Aggregations using your $pdo resource
    $total_evidence = $pdo->query("SELECT COUNT(*) FROM evidence_records")->fetchColumn();
    $total_cases    = $pdo->query("SELECT COUNT(DISTINCT case_number) FROM evidence_records")->fetchColumn();
    $total_users    = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    
    // B. Storage Allocation Breakdown Maps
    $stage_stmt = $pdo->query("SELECT workflow_stage AS label, COUNT(*) AS value FROM evidence_records GROUP BY workflow_stage");
    $workflow_stages = $stage_stmt->fetchAll(PDO::FETCH_ASSOC);

    // C. Live Access Feed (Matches your audit schema join flawlessly)
    $audit_stmt = $pdo->query("SELECT s.id, s.action_type, s.description, s.timestamp, u.username 
                               FROM system_activity_audit s 
                               LEFT JOIN users u ON s.user_id = u.id 
                               ORDER BY s.id DESC LIMIT 5");
    $recent_activities = $audit_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Send successful response payload object matching frontend structure
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "metrics" => [
            "total_items" => (int)$total_evidence,
            "active_cases" => (int)$total_cases,
            "active_personnel" => (int)$total_users
        ],
        "breakdowns" => [
            "by_stage" => $workflow_stages
        ],
        "recent_activity" => $recent_activities
    ]);

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Forensic pipeline aggregation error: " . $e->getMessage()
    ]);
}
?>