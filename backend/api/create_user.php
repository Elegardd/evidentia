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

$username           = isset($inputData['username']) ? trim($inputData['username']) : '';
$password           = isset($inputData['password']) ? trim($inputData['password']) : '';
$role               = isset($inputData['role']) ? trim($inputData['role']) : 'officer';
$sub_role           = isset($inputData['sub_role']) ? trim($inputData['sub_role']) : '';
$first_name         = isset($inputData['first_name']) ? trim($inputData['first_name']) : '';
$last_name          = isset($inputData['last_name']) ? trim($inputData['last_name']) : '';
$email_address      = isset($inputData['email_address']) ? trim($inputData['email_address']) : '';
$contact_number     = isset($inputData['contact_number']) ? trim($inputData['contact_number']) : '';
$badge_number        = isset($inputData['badge_number']) ? trim($inputData['badge_number']) : '';
$agency_rank_title   = isset($inputData['agency_rank_title']) ? trim($inputData['agency_rank_title']) : 'Operator';
$department_division = isset($inputData['department_division']) ? trim($inputData['department_division']) : 'Operations Division';

// Basic verification fallback
if (empty($username) || empty($password) || empty($sub_role)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "All mandatory fields must be completed."]);
    exit();
}

// Restrict role values to contain admin and officer only
if (!in_array($role, ['admin', 'officer'])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid authorization tier specified."]);
    exit();
}

// Basic validation fallback for the badge number
if (empty($badge_number)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "An official Badge Number must be assigned."]);
    exit();
}

// NEW: Server-side validation block tailored for Philippine formats (09xxxxxxxxx or +639xxxxxxxxx)
if (empty($contact_number)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Contact number is required."]);
    exit();
}

// PHP regular expression matching your React app validation rules
if (!preg_match('/^(09|\+639)\d{9}$/', $contact_number)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Invalid contact format. Must be a valid Philippine mobile number (e.g., 0917XXXXXXX or +63917XXXXXXX)."
    ]);
    exit();
}

// Validate ENUM values for sub_role parameter matching
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
    // 1. Double check that the username is completely unique
    $checkStmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
    $checkStmt->execute(['username' => $username]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409); // Conflict code
        echo json_encode(["status" => "error", "message" => "This username handles an active account already."]);
        exit();
    }

    // 1b. Double check that the badge number is completely unique across the agency
    $badgeCheckStmt = $pdo->prepare("SELECT id FROM users WHERE badge_number = :badge_number LIMIT 1");
    $badgeCheckStmt->execute(['badge_number' => $badge_number]);

    if ($badgeCheckStmt->fetch()) {
        http_response_code(409); // Conflict code
        echo json_encode(["status" => "error", "message" => "This Badge Number is already issued to another operator record."]);
        exit();
    }

    // 2. COMMIT PLAIN TEXT DIRECTLY
    $storedPassword = $password;

    // 3. Insert user details into the database including new profile attributes
    $insertStmt = $pdo->prepare("INSERT INTO users (username, password_hash, role, sub_role, first_name, last_name, email_address, contact_number, badge_number, agency_rank_title, department_division, 
            account_status, created_at) VALUES (:username, :password_hash, :role, :sub_role, :first_name, :last_name, :email_address, :contact_number,:badge_number, :agency_rank_title, :department_division, 
            'active', NOW())");
    $insertStmt->execute([
        'username'           => $username,
        'password_hash'      => $storedPassword,
        'role'               => $role,
        'sub_role'           => $sub_role,
        'first_name'         => $first_name,
        'last_name'          => $last_name,
        'email_address'      => $email_address,
        'contact_number'     => $contact_number,
        'badge_number'        => $badge_number,
        'agency_rank_title'   => $agency_rank_title,
        'department_division' => $department_division
        
    ]);

    http_response_code(201); // Created status
    echo json_encode([
        "status"  => "success",
        "message" => "Account successfully committed to database."
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database exception error: " . $e->getMessage()]);
    exit();
}