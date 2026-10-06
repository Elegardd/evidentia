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

// UPDATE: Force both PHP and MySQL to use the exact same UTC timezone
date_default_timezone_set('UTC');
$pdo->exec("SET time_zone = '+00:00'");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// HYBRID PARSING: Tries JSON first, falls back to traditional Form Data ($_POST)
$inputData = json_decode(file_get_contents("php://input"), true);

$username = trim($inputData['username'] ?? $_POST['username'] ?? '');
$password = trim($inputData['password'] ?? $_POST['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Please fill out all fields."]);
    exit();
}

try {
    // UPDATED: Added account_status and last_login_at to the database query pool
    $stmt = $pdo->prepare("SELECT id, username, password_hash, role, sub_role, first_name, last_name, account_status, failed_attempts, lockout_until FROM users WHERE username = :identifier OR email_address = :identifier LIMIT 1");
    $stmt->execute(['identifier' => $username]);
    $user = $stmt->fetch();

    // UPDATE: Check if account is currently locked out
    if ($user && !empty($user['lockout_until'])) {
        // Convert DB time to Unix timestamp safely
        $lockoutTime = strtotime($user['lockout_until']);
        $currentTime = time(); // Raw PHP epoch seconds

        if ($lockoutTime > $currentTime) {
            http_response_code(403);
            echo json_encode([
                "status" => "error",
                "message" => "Too many failed attempts. Terminal access suspended.",
                "lockout_until" => $lockoutTime
            ]);
            exit();
        }
    }

    // FIXED: Ensured $user is a valid array row BEFORE checking credentials to prevent fatal script exceptions
    if ($user && $password === $user['password_hash']) {

        $status = $user['account_status'] ?? 'active';

        // STATUS FILTER 1: Block Suspended Operators
        if ($status === 'suspended') {
            // Log security failure event
            $logAudit = $pdo->prepare("INSERT INTO system_activity_audit (user_id, action_type, description) VALUES (:user_id, 'LOGIN_REJECTED', :description)");
            $logAudit->execute([
                'user_id' => intval($user['id']),
                'description' => "Rejected system entry: Suspended account credentials provided."
            ]);

            http_response_code(403); // Forbidden access tier
            echo json_encode(["status" => "error", "message" => "Access Denied: This operator account has been suspended. Please contact your station administrator."]);
            exit();
        }

        // STATUS FILTER 2: Block Archived Operators
        if ($status === 'archived') {
            // Log security failure event
            $logAudit = $pdo->prepare("INSERT INTO system_activity_audit (user_id, action_type, description) VALUES (:user_id, 'LOGIN_REJECTED', :description)");
            $logAudit->execute([
                'user_id' => intval($user['id']),
                'description' => "Rejected system entry: Archived/Retired account credentials provided."
            ]);

            http_response_code(403); // Forbidden access tier
            echo json_encode(["status" => "error", "message" => "Access Denied: This account has been permanently archived or retired."]);
            exit();
        }

        // --- ACCOUNT IS ACTIVE: PROCESS ACCESS ACCESSION PARAMS ---

        // UPDATE: Reset failed attempts counter on successful login
        $resetAttempts = $pdo->prepare("UPDATE users SET failed_attempts = 0, lockout_until = NULL WHERE id = :id");
        $resetAttempts->execute(['id' => intval($user['id'])]);

        // Write login success record into the global system audit
        $logLogin = $pdo->prepare("INSERT INTO system_activity_audit (user_id, action_type, description) VALUES (:user_id, 'USER_LOGIN', :description)");
        $logLogin->execute([
            'user_id' => intval($user['id']),
            'description' => "User account session successfully initialized for operator terminal access."
        ]);

        // Update the active user's timestamp marker to track live operations safely
        $updateTimestamp = $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = :id");
        $updateTimestamp->execute(['id' => intval($user['id'])]);

        // Combine first_name and last_name smoothly for the frontend payload
        $computedFullName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        if (empty($computedFullName)) {
            $computedFullName = $user['username']; // Fallback if names are completely blank
        }

        echo json_encode([
            "status" => "success",
            "message" => "Login successful!",
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "role" => $user['role'],
                "sub_role" => $user['sub_role'],
                "full_name" => $computedFullName
            ]
        ]);
    } else {
        // UPDATE: Increment failed attempts counter and handle lockout logic
        if ($user) {
            $maxAttempts = 3;
            // Uncomment this line below if you prefer it in "minutes"  
            // $lockoutMinutes = 15;
            // UPDATE: Changed variable from minutes to seconds
            $lockoutSeconds = 900; // Set this to whatever number of seconds you want to test

            $newAttempts = intval($user['failed_attempts']) + 1;

            if ($newAttempts >= $maxAttempts) {

                // Uncomment this line below if you prefer it in "minutes"    
                // $expiryTimestamp = time() + ($lockoutMinutes * 60);
                $expiryTimestamp = time() + $lockoutSeconds;

                $updateLockout = $pdo->prepare("UPDATE users SET failed_attempts = :attempts, lockout_until = FROM_UNIXTIME(:expiry) WHERE id = :id");
                $updateLockout->execute([
                    'attempts' => $newAttempts,
                    'expiry' => $expiryTimestamp,
                    'id' => intval($user['id'])
                ]);

                http_response_code(401);
                echo json_encode([
                    "status" => "error",
                    "message" => "Too many failed attempts. Terminal access suspended.",
                    "lockout_until" => $expiryTimestamp
                ]);
            } else {
                $updateAttempts = $pdo->prepare("UPDATE users SET failed_attempts = :attempts WHERE id = :id");
                $updateAttempts->execute([
                    'attempts' => $newAttempts,
                    'id' => intval($user['id'])
                ]);

                $remaining = $maxAttempts - $newAttempts;
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Invalid username or password. " . $remaining . " attempt(s) remaining."]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Invalid username or password."]);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    // Fallback: Provide an un-revealing error signature on production instances
    echo json_encode(["status" => "error", "message" => "Server transaction failure."]);
    exit();
}
?>