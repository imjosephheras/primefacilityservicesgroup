<?php
require_once __DIR__ . '/../includes/config.php';
vtSession();
$_SESSION = [];
session_destroy();
header('Location: ' . VT_BASE_URL . '/login/');
exit;
