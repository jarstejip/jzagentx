<?php
declare(strict_types=1);
require_once __DIR__ . '/config/database.php';

class DatabaseStorage {
    private PDO $pdo;

    public function __construct() {
        $this->pdo = get_db_connection();
    }

    public function storeLog(string $action, string $modelFamily, int $tokens): bool {
        $stmt = $this->pdo->prepare("INSERT INTO audit_logs (action, model_family, tokens_consumed) VALUES (:action, :family, :tokens)");
        return $stmt->execute([
            'action' => $action,
            'family' => $modelFamily,
            'tokens' => $tokens
        ]);
    }
}
