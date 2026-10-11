<?php
ob_start();
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit();
}

$filePath = $_GET['file'] ?? '';

if (empty($filePath)) {
    http_response_code(400);
    exit("Missing file path.");
}

// Strip protocol and domain if a full URL was passed in
if (preg_match('/^https?:\/\//i', $filePath)) {
    $parsedUrl = parse_url($filePath);
    $filePath = ltrim($parsedUrl['path'] ?? '', '/');
}

// Clean path up to locate /uploads/ safely from backend/api/
$cleanPath = str_replace(['backend/', 'api/'], '', $filePath);
$cleanPath = ltrim($cleanPath, '/\\');

// If the path doesn't start with uploads, prepend it
if (!str_starts_with($cleanPath, 'uploads/')) {
    $cleanPath = 'uploads/' . $cleanPath;
}

$absolutePath = dirname(__DIR__) . '/' . $cleanPath;

if (!file_exists($absolutePath) || !is_file($absolutePath)) {
    http_response_code(404);
    exit("File not found on server at: " . $absolutePath);
}

$mimeType = mime_content_type($absolutePath) ?: 'application/octet-stream';
$fileName = basename($absolutePath);

ob_end_clean();

header('Content-Description: File Transfer');
header('Content-Type: ' . $mimeType);
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Length: ' . filesize($absolutePath));
header('Cache-Control: must-revalidate');
header('Pragma: public');

readfile($absolutePath);
exit();
?>