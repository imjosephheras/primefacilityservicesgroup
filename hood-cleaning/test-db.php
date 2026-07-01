<?php
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

$result = [
    'status'  => 'error',
    'message' => '',
    'details' => [],
];

try {
    $pdo = getDB();

    // Simple connectivity check
    $stmt = $pdo->query('SELECT VERSION() AS version, NOW() AS server_time');
    $row  = $stmt->fetch();

    $result['status']  = 'ok';
    $result['message'] = 'Database connection successful';
    $result['details'] = [
        'host'        => DB_HOST,
        'port'        => DB_PORT,
        'database'    => DB_NAME,
        'mysql_version' => $row['version'] ?? null,
        'server_time'   => $row['server_time'] ?? null,
    ];
} catch (PDOException $e) {
    $result['message'] = 'Connection failed: ' . $e->getMessage();
    $result['details'] = [
        'host'     => DB_HOST,
        'port'     => DB_PORT,
        'database' => DB_NAME,
    ];
    http_response_code(500);
}

echo json_encode($result, JSON_PRETTY_PRINT);
