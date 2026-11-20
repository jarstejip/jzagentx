<?php
declare(strict_types=1);
require_once __DIR__ . '/config/database.php';

function setup_database(): void {
    $pdo = get_db_connection();
    $sql = file_get_contents(__DIR__ . '/database.sql');
    $pdo->exec($sql);
    echo "[Setup] Database initialized successfully.\n";
}

if (php_sapi_name() === 'cli') {
    setup_database();
}
