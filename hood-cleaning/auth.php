<?php
require_once __DIR__ . '/config.php';
startSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ' . APP_URL . '/login.php');
    exit;
}

$email    = trim($_POST['email']    ?? '');
$password = $_POST['password'] ?? '';
$redirect = $_POST['redirect'] ?? APP_URL . '/dashboard.php';

// Sanitize redirect — only allow same-origin paths
if (!str_starts_with($redirect, APP_URL)) {
    $redirect = APP_URL . '/dashboard.php';
}

$error = '';

if ($email === '' || $password === '') {
    $error = 'Please enter your email and password.';
} else {
    try {
        $db   = getDB();
        $stmt = $db->prepare('SELECT id, name, email, password_hash, role, active FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && $user['active'] && password_verify($password, $user['password_hash'])) {
            session_regenerate_id(true);
            $_SESSION['user_id']    = $user['id'];
            $_SESSION['user_name']  = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_role']  = $user['role'];
            $_SESSION['last_regen'] = time();

            // Update last login
            $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')->execute([$user['id']]);

            header('Location: ' . $redirect);
            exit;
        } else {
            $error = 'Invalid email or password.';
        }
    } catch (Exception $e) {
        $error = 'Database error. Please try again.';
    }
}

// Pass error back to login page via session flash
$_SESSION['login_error']    = $error;
$_SESSION['login_email']    = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$_SESSION['login_redirect'] = $redirect;
header('Location: ' . APP_URL . '/login.php');
exit;
