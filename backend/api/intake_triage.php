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

// 1. Connectivity Allocation matching your reference environment
require_once __DIR__ . '/../config/db_connect.php';

// Safe Fallback: Ensure the database is explicitly targeted
try {
    if (isset($pdo)) {
        $conn = $pdo;
    } else {
        $target_db = !empty($db_name) ? $db_name : 'evidentia_db'; 
        $conn = new PDO("mysql:host=$host;dbname=$target_db;charset=utf8mb4", $username, $password);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
} catch(PDOException $exception) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database failure: " . $exception->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// ==========================================
// METHOD GET: FETCH DIRECTORY RECORD SETS
// ==========================================
if ($method === 'GET') {
    try {
        $query = "SELECT * FROM evidence_records WHERE is_archived = 0 ORDER BY id DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $records = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // CRITICAL FRONTEND FIX: Explicitly duplicate unit_descriptor data to physical_description 
            if (isset($row['unit_descriptor'])) {
                $row['physical_description'] = $row['unit_descriptor'];
            }

            // DECODE WITNESSES DATA FOR FRONTEND
            if (isset($row['witnesses_data']) && !empty($row['witnesses_data'])) {
                $row['witnesses'] = json_decode($row['witnesses_data'], true);
            } else {
                $row['witnesses'] = [];
            }
            
            // WORKFLOW STAGE NORMALIZATION: Clean up legacy text values on retrieval
            if (isset($row['workflow_stage'])) {
                $stage = trim($row['workflow_stage']);
                if (strpos($stage, 'On Field') === 0 || empty($stage)) {
                    $row['workflow_stage'] = 'On Field';
                } elseif (strpos($stage, 'In Storage') === 0) {
                    $row['workflow_stage'] = 'In Storage';
                }
            } else {
                $row['workflow_stage'] = 'On Field';
            }

            
            $row['collector_signature_hash']  = isset($row['collector_signature_hash']) ? $row['collector_signature_hash'] : null;
            $row['custodian_signature_hash']  = isset($row['custodian_signature_hash']) ? $row['custodian_signature_hash'] : null;
            $row['supervisor_signature_hash'] = isset($row['supervisor_signature_hash']) ? $row['supervisor_signature_hash'] : null;
            
            $records[] = $row;
        }
        
        http_response_code(200);
        echo json_encode(["status" => "success", "records" => $records]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception error: " . $e->getMessage()]);
    }
    exit();
}

// ==========================================
// METHOD POST: WRITE NEW EVIDENCE DATA BLOCK
// ==========================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $evidence_id          = !empty($data['evidence_id']) ? trim($data['evidence_id']) : 'EV-' . uniqid();
    $case_number          = isset($data['case_number']) ? trim($data['case_number']) : '';
    $investigating_agency = isset($data['investigating_agency']) ? trim($data['investigating_agency']) : '';
    $evidence_type        = isset($data['evidence_type']) ? trim($data['evidence_type']) : 'Digital Media Unit';
    $quantity             = isset($data['quantity']) ? (int)$data['quantity'] : 1;
    $case_title           = isset($data['case_title']) ? trim($data['case_title']) : null;
    $suspect_names        = isset($data['suspect_names']) ? trim($data['suspect_names']) : null;
    $witness_names        = isset($data['witness_names']) ? trim($data['witness_names']) : null;
    $witnesses_data       = isset($data['witnesses']) && is_array($data['witnesses']) ? json_encode($data['witnesses']) : null;
    $storage_vault        = isset($data['storage_vault']) ? trim($data['storage_vault']) : null;
    $turned_over_by_agency= isset($data['turned_over_by_agency']) ? trim($data['turned_over_by_agency']) : null;
    $received_by_agency   = isset($data['received_by_agency']) ? trim($data['received_by_agency']) : null;
    $retrieval_address    = isset($data['retrieval_address']) ? trim($data['retrieval_address']) : null;
    $certified_by         = isset($data['certified_by']) ? trim($data['certified_by']) : null;
    $noted_by             = isset($data['noted_by']) ? trim($data['noted_by']) : null;
    $collection_place     = isset($data['collection_place']) ? trim($data['collection_place']) : null;

    // Direct Extraction Sync
    if (!empty($data['physical_description'])) {
        $unit_descriptor  = trim($data['physical_description']);
    } else {
        $unit_descriptor  = isset($data['unit_descriptor']) ? trim($data['unit_descriptor']) : 'pcs';
    }

    $condition_received   = isset($data['condition_received']) ? trim($data['condition_received']) : null;
    $collector_name       = isset($data['collector_name']) ? trim($data['collector_name']) : null;
    $date_collected_raw   = isset($data['date_collected']) ? trim($data['date_collected']) : null;
    $workflow_stage       = isset($data['workflow_stage']) ? trim($data['workflow_stage']) : 'On Field';
    $turned_over_by_name  = isset($data['turned_over_by_name']) ? trim($data['turned_over_by_name']) : null;
    $received_by_name     = isset($data['received_by_name']) ? trim($data['received_by_name']) : null;
    $turnover_remarks     = isset($data['turnover_remarks']) ? trim($data['turnover_remarks']) : null;

    $collector_signature_hash = isset($data['collector_signature_hash']) ? $data['collector_signature_hash'] : null;

    //  Extracting signatures
    $collector_signature_hash  = isset($data['collector_signature_hash']) ? $data['collector_signature_hash'] : null;
    $custodian_signature_hash  = isset($data['custodian_signature_hash']) ? $data['custodian_signature_hash'] : null;
    $supervisor_signature_hash = isset($data['supervisor_signature_hash']) ? $data['supervisor_signature_hash'] : null;

    if (empty($case_number) || empty($investigating_agency) || empty($evidence_id)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Validation failure: missing mandatory fields."]);
        exit();
    }

    // --- ENFORCED BACKEND DUPLICATE COLLISION CHECK ---
    try {
        $check_query = "SELECT COUNT(*) FROM evidence_records WHERE LOWER(case_number) = LOWER(:case_number) AND LOWER(investigating_agency) = LOWER(:investigating_agency) AND is_archived = 0";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->execute([
            'case_number' => $case_number,
            'investigating_agency' => $investigating_agency
        ]);
        
        if ($check_stmt->fetchColumn() > 0) {
            http_response_code(409); // 409 Conflict Configuration
            echo json_encode([
                "status" => "error",
                ]);
            exit();
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Validation verification failure: " . $e->getMessage()]);
        exit();
    }

    $date_collected_value = !empty($date_collected_raw) ? $date_collected_raw : null;

    try {
        $query = "INSERT INTO evidence_records (
                    evidence_id, case_number, investigating_agency, evidence_type, 
                    quantity, unit_descriptor, condition_received, collector_name, 
                    date_collected, workflow_stage, turned_over_by_name, received_by_name,
                    case_title, suspect_names, witness_names, witnesses_data, storage_vault, turned_over_by_agency, 
                    received_by_agency, retrieval_address, certified_by, noted_by, collection_place,
                    turnover_remarks, collector_signature_hash, custodian_signature_hash, supervisor_signature_hash
                  ) VALUES (
                    :evidence_id, :case_number, :investigating_agency, :evidence_type, 
                    :quantity, :unit_descriptor, :condition_received, :collector_name, 
                    :date_collected, :workflow_stage, :turned_over_by_name, :received_by_name,
                    :case_title, :suspect_names, :witness_names, :witnesses_data, :storage_vault, :turned_over_by_agency, 
                    :received_by_agency, :retrieval_address, :certified_by, :noted_by, :collection_place,
                    :turnover_remarks, :collector_signature_hash, :custodian_signature_hash, :supervisor_signature_hash
                  )";
                    
        $stmt = $conn->prepare($query);
        
        $stmt->execute([
            'evidence_id'          => $evidence_id,
            'case_number'          => $case_number,
            'investigating_agency' => $investigating_agency,
            'evidence_type'        => $evidence_type,
            'quantity'             => $quantity,
            'unit_descriptor'      => $unit_descriptor,
            'condition_received'   => $condition_received,
            'collector_name'       => $collector_name,
            'date_collected'       => $date_collected_value,
            'workflow_stage'       => $workflow_stage,
            'turned_over_by_name'  => $turned_over_by_name,
            'received_by_name'     => $received_by_name,
            'case_title'           => $case_title,
            'suspect_names'        => $suspect_names,
            'witness_names'        => $witness_names,
            'witnesses_data'        => $witnesses_data,
            'storage_vault'        => $storage_vault,
            'turned_over_by_agency'=> $turned_over_by_agency,
            'received_by_agency'   => $received_by_agency,
            'retrieval_address'    => $retrieval_address,
            'certified_by'         => $certified_by,
            'noted_by'             => $noted_by,
            'collection_place'     => $collection_place,
            'turnover_remarks'     => $turnover_remarks,
            'collector_signature_hash'  => $collector_signature_hash,
            'custodian_signature_hash'  => $custodian_signature_hash,
            'supervisor_signature_hash' => $supervisor_signature_hash
        ]);
        
        http_response_code(201);
        echo json_encode(["status" => "success", "id" => $conn->lastInsertId(), "evidence_id" => $evidence_id]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database write error: " . $e->getMessage()]);
    }
    exit();
}

// ==========================================
// METHOD PUT: UPDATE EXISTENT ENGINE ROW
// ==========================================
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data['id']) ? (int)$data['id'] : 0;

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Target update missing primary ID identifier."]);
        exit();
    }

    $case_number          = isset($data['case_number']) ? trim($data['case_number']) : '';
    $investigating_agency = isset($data['investigating_agency']) ? trim($data['investigating_agency']) : '';
    $evidence_type        = isset($data['evidence_type']) ? trim($data['evidence_type']) : '';
    $quantity             = isset($data['quantity']) ? (int)$data['quantity'] : 1;
    
    $case_title           = isset($data['case_title']) ? trim($data['case_title']) : null;
    $suspect_names        = isset($data['suspect_names']) ? trim($data['suspect_names']) : null;
    $witness_names        = isset($data['witness_names']) ? trim($data['witness_names']) : null;
    $witnesses_data       = isset($data['witnesses']) && is_array($data['witnesses']) ? json_encode($data['witnesses']) : null;
    $storage_vault        = isset($data['storage_vault']) ? trim($data['storage_vault']) : null;
    $turned_over_by_agency= isset($data['turned_over_by_agency']) ? trim($data['turned_over_by_agency']) : null;
    $received_by_agency   = isset($data['received_by_agency']) ? trim($data['received_by_agency']) : null;
    $retrieval_address    = isset($data['retrieval_address']) ? trim($data['retrieval_address']) : null;
    $collection_place     = isset($data['collection_place']) ? trim($data['collection_place']) : null;

    // Explicit structural mapping fallback checks
    if (!empty($data['physical_description'])) {
        $unit_descriptor  = trim($data['physical_description']);
    } else {
        $unit_descriptor  = isset($data['unit_descriptor']) ? trim($data['unit_descriptor']) : '';
    }

    $condition_received   = isset($data['condition_received']) ? trim($data['condition_received']) : null;
    $collector_name       = isset($data['collector_name']) ? trim($data['collector_name']) : null;
    $date_collected_raw   = isset($data['date_collected']) ? trim($data['date_collected']) : null;
    $workflow_stage       = !empty($data['workflow_stage']) ? trim($data['workflow_stage']) : 'On Field';
    $turned_over_by_name  = isset($data['turned_over_by_name']) ? trim($data['turned_over_by_name']) : null;
    
    // Mapping internal fields sent from the turnover action component
    $received_by_name     = isset($data['received_by_name']) ? trim($data['received_by_name']) : null;
    $certified_by         = isset($data['received_by_name']) ? trim($data['received_by_name']) : (isset($data['certified_by']) ? trim($data['certified_by']) : null);
    $noted_by             = isset($data['noted_by_name']) ? trim($data['noted_by_name']) : (isset($data['noted_by']) ? trim($data['noted_by']) : null);
    $turnover_remarks     = isset($data['turnover_remarks']) ? trim($data['turnover_remarks']) : null;

    $collector_signature_hash  = isset($data['collector_signature_hash']) ? $data['collector_signature_hash'] : null;
    $custodian_signature_hash  = isset($data['custodian_signature_hash']) ? $data['custodian_signature_hash'] : null;
    $supervisor_signature_hash = isset($data['supervisor_signature_hash']) ? $data['supervisor_signature_hash'] : null;
    
    $date_collected_value = !empty($date_collected_raw) ? $date_collected_raw : null;

    try {
        $query = "UPDATE evidence_records SET 
                    case_number = :case_number,
                    investigating_agency = :investigating_agency,
                    evidence_type = :evidence_type,
                    quantity = :quantity,
                    unit_descriptor = :unit_descriptor,
                    condition_received = :condition_received,
                    collector_name = :collector_name,
                    date_collected = :date_collected,
                    workflow_stage = :workflow_stage,
                    turned_over_by_name = :turned_over_by_name,
                    received_by_name = :received_by_name,
                    case_title = :case_title,
                    suspect_names = :suspect_names,
                    witness_names = :witness_names,
                    witnesses_data = :witnesses_data,
                    storage_vault = :storage_vault,
                    turned_over_by_agency = :turned_over_by_agency,
                    received_by_agency = :received_by_agency,
                    retrieval_address = :retrieval_address,
                    certified_by = :certified_by,
                    noted_by = :noted_by,
                    collection_place = :collection_place,
                    turnover_remarks = :turnover_remarks,
                    collector_signature_hash = :collector_signature_hash,
                    custodian_signature_hash = :custodian_signature_hash,
                    supervisor_signature_hash = :supervisor_signature_hash
                  WHERE id = :id";
                    
        $stmt = $conn->prepare($query);
        $stmt->execute([
            'id'                   => $id,
            'case_number'          => $case_number,
            'investigating_agency' => $investigating_agency,
            'evidence_type'        => $evidence_type,
            'quantity'             => $quantity,
            'unit_descriptor'      => $unit_descriptor,
            'condition_received'   => $condition_received,
            'collector_name'       => $collector_name,
            'date_collected'       => $date_collected_value,
            'workflow_stage'       => $workflow_stage,
            'turned_over_by_name'  => $turned_over_by_name,
            'received_by_name'     => $received_by_name,
            'case_title'           => $case_title,
            'suspect_names'        => $suspect_names,
            'witness_names'        => $witness_names,
            'witnesses_data'         => $witnesses_data,
            'storage_vault'        => $storage_vault,
            'turned_over_by_agency'=> $turned_over_by_agency,
            'received_by_agency'   => $received_by_agency,
            'retrieval_address'    => $retrieval_address,
            'certified_by'         => $certified_by,
            'noted_by'             => $noted_by,
            'collection_place'     => $collection_place,
            'turnover_remarks'     => $turnover_remarks,
            'collector_signature_hash'  => $collector_signature_hash,
            'custodian_signature_hash'  => $custodian_signature_hash,
            'supervisor_signature_hash' => $supervisor_signature_hash
        ]);
        
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Record updated successfully."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception error: " . $e->getMessage()]);
    }
    exit();
}

// ==========================================
// METHOD DELETE: PURGE OPERATIONS
// ==========================================
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = isset($data['id']) ? (int)$data['id'] : 0;

    // Extract the audit reason sent from the React modal input prompt
    $reason = isset($data['reason']) ? trim($data['reason']) : '';

    if (empty($id)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Purge request missing primary row ID pointer."]);
        exit();
    }

    if (empty($reason)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "An archiving justification reason is strictly required."]);
        exit();
    }

    $activeOfficerName = "Officer Custodian";
    
    try {
        $query = "UPDATE evidence_records 
                  SET workflow_stage = 'Archived',
                      is_archived = 1,
                      archive_reason = :reason,
                      archived_by_name = :officer,
                      created_at = created_at 
                  WHERE id = :id";
                  
        $stmt = $conn->prepare($query);
        $stmt->execute([
            'id'      => $id,
            'reason'  => $reason,
            'officer' => $activeOfficerName
        ]);
        
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Evidence entry registry successfully updated to Archived status."]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database exception error: " . $e->getMessage()]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method Not Allowed"]);
exit();
?>