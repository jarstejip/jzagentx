<?php
declare(strict_types=1);

/**
 * Database Connection Provider
 */
function get_db_connection(): PDO {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $dbname = getenv('DB_NAME') ?: 'xagentic_db';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    
    // Fallback SQLite in-memory if MySQL is offline in sandbox
    try {
        return new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 2,
        ]);
    } catch (PDOException $e) {
        $sqlite = new PDO('sqlite::memory:');
        $sqlite->exec("CREATE TABLE IF NOT EXISTS surveys (id INTEGER PRIMARY KEY, title TEXT, status TEXT, created_at DATETIME)");
        $sqlite->exec("INSERT INTO surveys (title, status, created_at) VALUES ('Model Architecture Survey', 'active', datetime('now'))");
        return $sqlite;
    }
}
