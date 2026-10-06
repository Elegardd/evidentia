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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

$inputData = json_decode(file_get_contents("php://input"), true);

$id                  = isset($inputData['id']) ? intval($inputData['id']) : 0;
$username            = isset($inputData['username']) ? trim($inputData['username']) : '';
$password            = isset($inputData['password']) ? trim($inputData['password']) : '';
$role                = isset($inputData['role']) ? trim($inputData['role']) : '';
$sub_role            = isset($inputData['sub_role']) ? trim($inputData['sub_role']) : '';
$first_name          = isset($inputData['first_name']) ? trim($inputData['first_name']) : '';
$last_name           = isset($inputData['last_name']) ? trim($inputData['last_name']) : '';
$email_address       = isset($inputData['email_address']) ? trim($inputData['email_address']) : '';
$contact_number      = isset($inputData['contact_number']) ? trim($inputData['contact_number']) : '';
$badge_number        = isset($inputData['badge_number']) ? trim($inputData['badge_number']) : '';
$agency_rank_title   = isset($inputData['agency_rank_title']) ? trim($inputData['agency_rank_title']) : 'Operator';
$department_division = isset($inputData['department_division']) ? trim($inputData['department_division']) : 'Operations Division';

// Validation logic for updating
if (empty($id) || empty($username) || empty($role) || empty($sub_role)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing required operator elements."]);
    exit();
}

// Restrict primary master role values
if (!in_array($role, ['admin', 'officer'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid authorization tier specified."]);
    exit();
}

// Server-side validation check tracking for the Philippine Contact Number setting
if (empty($contact_number)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Contact number cannot be left empty."]);
    exit();
}

if (!preg_match('/^(09|\+639)\d{9}$/', $contact_number)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Invalid format. Must be a valid Philippine mobile number structure (e.g., 0917XXXXXXX or +63917XXXXXXX)."
    ]);
    exit();
}

// Restrict functional detailed sub roles values
if (!in_array($sub_role, [
    'System Administrator', 
    'Supervisor / Reviewer', 
    'Auditor', 
    'Evidence Custodian', 
    'Evidence Collector / Forensic Technician'
])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid functional sub-role option provided."]);
    exit();
}

try {
    // 1. Ensure the new username isn't stolen by another user account
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = :username AND id != :id LIMIT 1");
    $checkStmt->execute([
        'username' => $username,
        'id'       => $id
    ]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409); // Conflict code
        echo json_encode(["status" => "error", "message" => "This username handles an active account already."]);
        exit();
    }

    // UPDATED/FIXED: Added email validation conflict guard to keep login directory unique
    if (!empty($email_address)) {
        $emailCheck = $pdo->prepare("SELECT id FROM users WHERE email_address = :email_address AND id != :id LIMIT 1");
        $emailCheck->execute([
            'email_address' => $email_address,
            'id'            => $id
        ]);

        if ($emailCheck->fetch()) {
            http_response_code(409);
            echo json_encode(["status" => "error", "message" => "This email address is already registered to another operator account."]);
            exit();
        }
    }

    // Ensure the updated Badge ID isn't duplicated by another active operator row
    $badgeCheck = $pdo->prepare("SELECT id FROM users WHERE badge_number = :badge_number AND id != :id LIMIT 1");
    $badgeCheck->execute([
        'badge_number' => $badge_number,
        'id'           => $id
    ]);

    if ($badgeCheck->fetch()) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "This Badge / Institutional ID is assigned to another operator."]);
        exit();
    }

    // 2. Build conditional query based on whether the password was left blank
    if ($password !== "") {
        $sql = "UPDATE users SET username = :username, password_hash = :password_hash, role = :role, sub_role = :sub_role, first_name = :first_name, last_name = :last_name, email_address = :email_address, contact_number = :contact_number, badge_number = :badge_number,
                    agency_rank_title = :agency_rank_title, department_division = :department_division WHERE id = :id";
        $params = [
            'username'            => $username,
            'password_hash'       => $password,
            'role'                => $role,
            'sub_role'            => $sub_role,
            'first_name'          => $first_name,
            'last_name'           => $last_name,
            'email_address'       => $email_address,
            'contact_number'      => $contact_number,
            'badge_number'        => $badge_number,
            'agency_rank_title'   => $agency_rank_title,
            'department_division' => $department_division,
            'id'                  => $id
        ];
    } else {
        $sql = "UPDATE users SET username = :username, role = :role, sub_role = :sub_role, first_name = :first_name, last_name = :last_name, email_address = :email_address, contact_number = :contact_number, badge_number = :badge_number,
                    agency_rank_title = :agency_rank_title, department_division = :department_division WHERE id = :id";
        $params = [
            'username'            => $username,
            'role'                => $role,
            'sub_role'            => $sub_role,
            'first_name'          => $first_name,
            'last_name'           => $last_name,
            'email_address'       => $email_address,
            'contact_number'      => $contact_number,
            'badge_number'        => $badge_number,
            'agency_rank_title'   => $agency_rank_title,
            'department_division' => $department_division,
            'id'                  => $id
        ];
    }

    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    http_response_code(200);
    echo json_encode([
        "status"  => "success",
        "message" => "Operator registry modified successfully."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database exception error: " . $e->getMessage()]);
    exit();
}
?>