<?php
require_once __DIR__ . '/../includes/config.php';
startSession();
$_SESSION = [];
session_destroy();
header('Location: ' . APP_URL . '/login.php?logout=1');
exit;
