<?php
// Ensure absolute clean buffering so no stray whitespace causes empty responses
ob_start();

ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit(json_encode(["status" => "success"]));
}

require_once __DIR__ . '/../config/db_connect.php';

try {
    if (isset($pdo)) {
        $conn = $pdo;
    } else {
        $target_db = ! empty($db_name) ? $db_name : 'evidentia_db';
        $conn      = new PDO("mysql:host=$host;dbname=$target_db;charset=utf8mb4", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ATTR_ERRMODE_EXCEPTION);
    }

    $method = $_SERVER['REQUEST_METHOD'];

    // --- 1. HANDLE DELETE REQUEST (CRUD: Delete from folder & database) ---
    if ($method === 'DELETE') {
        $input          = json_decode(file_get_contents('php://input'), true);
        $record_id      = (int) ($input['id'] ?? 0);
        $targetFilePath = $input['file_path'] ?? '';

        if ($record_id > 0 && ! empty($targetFilePath)) {
            // Remove physical file from correct directory root
            $relativePathClean = str_replace('backend/', '', $targetFilePath);
            $absolutePath      = dirname(__DIR__) . '/' . $relativePathClean;

            if (file_exists($absolutePath)) {
                unlink($absolutePath);
            }

            // Update database JSON array
            $stmt = $conn->prepare("SELECT images_data FROM evidence_records WHERE id = :id");
            $stmt->execute(['id' => $record_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row && ! empty($row['images_data'])) {
                $existingImages = json_decode($row['images_data'], true) ?: [];
                $updatedImages  = array_values(array_filter($existingImages, function ($img) use ($targetFilePath) {
                    return ! str_ends_with($targetFilePath, basename($img['file_path']));
                }));

                $updateStmt = $conn->prepare("UPDATE evidence_records SET images_data = :images_data WHERE id = :id");
                $updateStmt->execute([
                    'images_data' => json_encode($updatedImages),
                    'id'          => $record_id,
                ]);

                http_response_code(200);
                ob_end_clean();
                echo json_encode(["status" => "success", "message" => "Image deleted successfully from directory and database."]);
                exit();
            }
        }

        http_response_code(400);
        ob_end_clean();
        exit(json_encode(["status" => "error", "message" => "Invalid delete parameters provided."]));
    }

    // --- 2. HANDLE POST REQUEST (CRUD: Upload & create/update database links) ---
    if ($method === 'POST') {
        if (! isset($_FILES['evidence_files']) || empty($_FILES['evidence_files']['name'][0])) {
            http_response_code(400);
            ob_end_clean();
            exit(json_encode(["status" => "error", "message" => "No evidence files were provided."]));
        }

        $record_id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
        if ($record_id <= 0) {
            http_response_code(400);
            ob_end_clean();
            exit(json_encode(["status" => "error", "message" => "Missing or invalid target evidence record ID."]));
        }

        $folderKey      = 'EV-2026-' . str_pad($record_id, 4, '0', STR_PAD_LEFT);
        $evidenceFolder = 'evidence_' . $folderKey;
        $uploadDir      = dirname(__DIR__) . '/uploads/evidence_images/' . $evidenceFolder . '/';

        if (! is_dir($uploadDir)) {
            if (! mkdir($uploadDir, 0775, true)) {
                throw new Exception("Failed to create target directory: " . $uploadDir);
            }
        }

        $uploadedFiles = [];
        $fileNames     = is_array($_FILES['evidence_files']['name']) ? $_FILES['evidence_files']['name'] : [$_FILES['evidence_files']['name']];
        $fileTmpNames  = is_array($_FILES['evidence_files']['tmp_name']) ? $_FILES['evidence_files']['tmp_name'] : [$_FILES['evidence_files']['tmp_name']];
        $fileErrors    = is_array($_FILES['evidence_files']['error']) ? $_FILES['evidence_files']['error'] : [$_FILES['evidence_files']['error']];

        $fileCount = count($fileNames);

        for ($i = 0; $i < $fileCount; $i++) {
            if ($fileErrors[$i] === UPLOAD_ERR_OK) {
                $tmpName       = $fileTmpNames[$i];
                $originalName  = basename($fileNames[$i]);
                $fileExtension = pathinfo($originalName, PATHINFO_EXTENSION);

                $newFileName = 'EV_' . uniqid() . '_' . time() . '.' . $fileExtension;
                $destination = $uploadDir . $newFileName;

                // $relativePath = 'backend/uploads/evidence_images/' . $evidenceFolder . '/' . $newFileName;
                $relativePath = 'uploads/evidence_images/' . $evidenceFolder . '/' . $newFileName;

                if (move_uploaded_file($tmpName, $destination)) {
                    $uploadedFiles[] = [
                        "file_name" => $originalName,
                        "file_path" => $relativePath,
                    ];
                } else {
                    throw new Exception("Failed to move uploaded file: " . $originalName);
                }
            }
        }

        if (! empty($uploadedFiles)) {
            $stmt = $conn->prepare("SELECT images_data FROM evidence_records WHERE id = :id");
            $stmt->execute(['id' => $record_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $existingImages = [];
            if ($row && ! empty($row['images_data'])) {
                $existingImages = json_decode($row['images_data'], true) ?: [];
            }

            $allImages = array_merge($existingImages, $uploadedFiles);

            $updateStmt = $conn->prepare("UPDATE evidence_records SET images_data = :images_data WHERE id = :id");
            $updateStmt->execute([
                'images_data' => json_encode($allImages),
                'id'          => $record_id,
            ]);
        }

        http_response_code(200);
        $responsePayload = [
            "status"  => "success",
            "message" => "Files uploaded, sorted, and linked successfully.",
            "files"   => $uploadedFiles,
        ];
        ob_end_clean();
        echo json_encode($responsePayload);
        exit();
    }

    // Unsupported method fallback
    http_response_code(405);
    ob_end_clean();
    exit(json_encode(["status" => "error", "message" => "Method Not Allowed"]));

} catch (Exception $e) {
    http_response_code(200);
    ob_end_clean();
    echo json_encode(["status" => "error", "message" => "File processing error: " . $e->getMessage()]);
    exit();
}
