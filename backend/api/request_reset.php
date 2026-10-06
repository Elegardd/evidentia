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

// Require the explicit global data gateway path matching your login file environment
require_once __DIR__ . '/../config/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
    exit();
}

// HYBRID PARSING: Tries JSON first, falls back to traditional Form Data ($_POST)
$inputData = json_decode(file_get_contents("php://input"), true);
$email_input = trim($inputData['email'] ?? $_POST['email'] ?? '');

if (empty($email_input)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Email parameters missing from request envelope."
    ]);
    exit();
}

try {
    // Look up the active user by their official assigned email address
    $stmt = $pdo->prepare("SELECT id, username, email_address FROM users WHERE email_address = :email LIMIT 1");
    $stmt->execute(['email' => $email_input]);
    $user = $stmt->fetch();

    if ($user) {
        // Generate a secure, un-guessable cryptographic token string 
        $secure_token = bin2hex(random_bytes(16));
        
        // This is the link sent out; configure localhost or server target mapping domain here
        $recovery_link = "http://localhost:3000/reset-password?token=" . $secure_token;

        // Write this auditable security token generation event out into your system_activity_audit table
        $logAudit = $pdo->prepare("INSERT INTO system_activity_audit (user_id, action_type, description) VALUES (:user_id, 'PASSWORD_RESET_REQUEST', :description)");
        $logAudit->execute([
            'user_id' => intval($user['id']),
            'description' => "A password recovery token link was successfully generated for username: " . $user['username']
        ]);

        /* PRODUCTION EMAIL UTILITY TRIGGER ZONE
           Uncomment and configure this function call when your mail transport engine is active:
           
           $subject = "Evidentia Vault Security - Password Recovery Notice";
           $email_body = "Hello " . $user['username'] . ",\n\nA one-time password recovery request was initiated. Use the link below to verify your session identity:\n\n" . $recovery_link;
           $headers = "From: security-vault@evidentia.local";
           mail($user['email_address'], $subject, $email_body, $headers);
        */

        echo json_encode([
            "status" => "success",
            "message" => "Recovery instructions transmitted. Check your inbox for further authorization steps."
        ]);
    } else {
        // For security context parsing, return a 404 meaning email wasn't found
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "The provided email profile was not discovered inside active node channels.",
            "debug_link" => $recovery_link
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Server transaction failure handling authentication request pipeline."
    ]);
    exit();
}
?>