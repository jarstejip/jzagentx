<?php
declare(strict_types=1);
require_once __DIR__ . '/config/database.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /landing.php');
    exit;
}
echo "<h1>Welcome to XAgentic Portal</h1>";
