<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, PUT");

$host = "localhost";
$db_name = "your_database_name";
$username = "your_db_user";
$password = "your_db_password";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8mb4", $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $e->getMessage()]);
    exit;
}

$title = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$agency = $_POST['agency'] ?? '';
$category = $_POST['category'] ?? '';
$recordId = $_POST['id'] ?? null;

if (empty($title)) {
    echo json_encode(["success" => false, "message" => "Title is required."]);
    exit;
}

$uploadedPaths = [];

try {
    $pdo->beginTransaction();

    // 1. Insert or Update text fields first to get/confirm the evidence ID
    if (!empty($recordId)) {
        $stmt = $pdo->prepare("UPDATE evidence_records SET title = ?, description = ?, agency = ?, category = ? WHERE id = ?");
        $stmt->execute([$title, $description, $agency, $category, $recordId]);
        $evidenceId = $recordId;
    } else {
        $stmt = $pdo->prepare("INSERT INTO evidence_records (title, description, agency, category, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$title, $description, $agency, $category]);
        $evidenceId = $pdo->lastInsertId(); // This gives us our unique ID
    }

    // 2. Create a unique folder directory using the evidence ID
    $uploadDir = __DIR__ . '/uploads/evidence/' . $evidenceId . '/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // 3. Process and move multiple images into this specific folder
    if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
        foreach ($_FILES['images']['name'] as $key => $name) {
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $tmpName = $_FILES['images']['tmp_name'][$key];
                $fileName = basename($name);
                
                // Clean file name and keep it unique within the folder
                $safeName = time() . '_' . preg_replace("/[^a-zA-Z0-9\._-]/", "", $fileName);
                $targetFilePath = $uploadDir . $safeName;

                if (move_uploaded_file($tmpName, $targetFilePath)) {
                    // Store the relative path including the unique directory
                    $uploadedPaths[] = 'uploads/evidence/' . $evidenceId . '/' . $safeName;
                }
            }
        }
    }

    // 4. Save Image Paths to the Database
    if (!empty($uploadedPaths)) {
        $imgStmt = $pdo->prepare("INSERT INTO evidence_images (evidence_id, image_path, uploaded_at) VALUES (?, ?, NOW())");
        foreach ($uploadedPaths as $path) {
            $imgStmt->execute([$evidenceId, $path]);
        }
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Record and images saved successfully in directory: uploads/evidence/{$evidenceId}/",
        "evidence_id" => $evidenceId,
        "saved_images" => $uploadedPaths
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    
    // Clean up files if transaction fails
    if (!empty($evidenceId)) {
        $targetDir = __DIR__ . '/uploads/evidence/' . $evidenceId . '/';
        if (is_dir($targetDir)) {
            array_map('unlink', glob("$targetDir/*.*"));
            rmdir($targetDir);
        }
    }

    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>