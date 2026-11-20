<?php
declare(strict_types=1);
require_once __DIR__ . '/config/database.php';

/**
 * JZAGENTIC Core Landing Controller & Script Customizer
 * Real-Time Code Execution & Model Hub Interface
 */

function clean_string(?string $input): string {
    if ($input === null) return '';
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function is_admin_logged_in(): bool {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    return isset($_SESSION['user_id']) && ($_SESSION['role'] ?? '') === 'admin';
}

function get_filtered_surveys(PDO $pdo, array $filters = []): array {
    $sql = "SELECT id, title, status, created_at FROM surveys WHERE 1=1";
    $params = [];

    if (!empty($filters['status'])) {
        $sql .= " AND status = :status";
        $params['status'] = $filters['status'];
    }

    $sql .= " ORDER BY created_at DESC LIMIT 50";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Check admin authorization
$isAdmin = is_admin_logged_in();
$surveys = [];

try {
    $pdo = get_db_connection();
    $surveys = get_filtered_surveys($pdo, ['status' => 'active']);
} catch (Throwable $e) {
    error_log("[JZAGENTIC Error] " . $e->getMessage());
}

?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JZAGENTIC - Production Portal</title>
    <link rel="stylesheet" href="/inspect_tabs.js">
</head>
<body style="background: #0b0f19; color: #e2e8f0; font-family: monospace; padding: 2rem;">
    <h1>⚡ JZAGENTIC Production Architecture Active</h1>
    <p>Engine status: <strong>UNCENSORED & UNLIMITED TOKENS</strong></p>
    <div style="border: 1px solid #334155; padding: 1rem; border-radius: 8px;">
        <h3>System Diagnostics</h3>
        <ul>
            <li>Session Role: <?= $isAdmin ? 'Admin Authenticated' : 'Guest Developer' ?></li>
            <li>Database Connection: <?= isset($pdo) ? 'Connected (MySQL/Postgres)' : 'Simulated Sandbox' ?></li>
            <li>Surveys Loaded: <?= count($surveys) ?> records</li>
        </ul>
    </div>
</body>
</html>
