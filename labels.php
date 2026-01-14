<?php
require 'auth.php';
require_login();
enforce_session_timeout();
require 'db.php';

// Ensure table exists
$pdo->exec("
CREATE TABLE IF NOT EXISTS user_labels (
    user_id INT PRIMARY KEY,
    labels_json LONGTEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_labels_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)");

define('MAX_LABELS', 79);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);

    if (!is_array($payload) || !isset($payload['labels']) || !is_array($payload['labels'])) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Neispravan format']);
        exit;
    }

    $labels = $payload['labels'];
    if (count($labels) > MAX_LABELS) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Previše etiketa (max ' . MAX_LABELS . ')']);
        exit;
    }

    // Trim and normalize strings
    $safe = [];
    foreach ($labels as $l) {
        if (!is_array($l)) {
            continue;
        }
        $safe[] = [
            'patient' => isset($l['patient']) ? trim((string)$l['patient']) : '',
            'room'    => isset($l['room']) ? trim((string)$l['room']) : '',
            'drug'    => isset($l['drug']) ? trim((string)$l['drug']) : '',
            'time'    => isset($l['time']) ? trim((string)$l['time']) : ''
        ];
    }

    $json = json_encode($safe, JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare("
        INSERT INTO user_labels (user_id, labels_json)
        VALUES (:uid, :labels)
        ON DUPLICATE KEY UPDATE labels_json = VALUES(labels_json), updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->execute([':uid' => $_SESSION['user_id'], ':labels' => $json]);

    header('Content-Type: application/json');
    echo json_encode(['status' => 'ok']);
    exit;
}

// GET - return labels
$stmt = $pdo->prepare("SELECT labels_json FROM user_labels WHERE user_id = :uid LIMIT 1");
$stmt->execute([':uid' => $_SESSION['user_id']]);
$row = $stmt->fetch();

$labels = [];
if ($row && !empty($row['labels_json'])) {
    $decoded = json_decode($row['labels_json'], true);
    if (is_array($decoded)) {
        $labels = $decoded;
    }
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['labels' => $labels]);
