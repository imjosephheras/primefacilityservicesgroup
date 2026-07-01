<?php
require_once __DIR__ . '/../includes/config.php';
vtSession();

if (!empty($_SESSION['vt_logged_in'])) {
    header('Location: ' . VT_BASE_URL . '/index.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['username'] ?? '');
    $pass = $_POST['password'] ?? '';
    if ($user === ADMIN_USER && $pass === ADMIN_PASS) {
        session_regenerate_id(true);
        $_SESSION['vt_logged_in'] = true;
        $_SESSION['vt_user']      = $user;
        header('Location: ' . VT_BASE_URL . '/index.php');
        exit;
    }
    $error = 'Invalid username or password.';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visitor Tracking — Login</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#0f1729;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#fff;border-radius:16px;padding:48px 40px;width:100%;max-width:420px;box-shadow:0 25px 60px rgba(0,0,0,.4)}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:32px;justify-content:center}
.logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#1a5cff,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center}
.logo-icon svg{width:24px;height:24px;fill:#fff}
.logo-text{font-size:18px;font-weight:700;color:#0f1729;line-height:1.2}
.logo-text span{display:block;font-size:12px;font-weight:400;color:#64748b}
h1{font-size:24px;font-weight:700;color:#0f1729;margin-bottom:8px;text-align:center}
p.sub{font-size:14px;color:#64748b;text-align:center;margin-bottom:28px}
label{display:block;font-size:13px;font-weight:500;color:#374151;margin-bottom:6px}
input{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s}
input:focus{border-color:#1a5cff;box-shadow:0 0 0 3px rgba(26,92,255,.12)}
.field{margin-bottom:18px}
.btn{width:100%;padding:13px;background:#1a5cff;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .2s;margin-top:6px}
.btn:hover{background:#1447d4}
.error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:18px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
    </div>
    <div class="logo-text">Visitor Tracking<span>Prime Facility Services Group</span></div>
  </div>
  <h1>Welcome back</h1>
  <p class="sub">Sign in to your admin account</p>
  <?php if ($error): ?>
  <div class="error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>
  <form method="POST">
    <div class="field">
      <label>Username</label>
      <input type="text" name="username" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" placeholder="admin" required autofocus>
    </div>
    <div class="field">
      <label>Password</label>
      <input type="password" name="password" placeholder="••••••••" required>
    </div>
    <button class="btn" type="submit">Sign In</button>
  </form>
</div>
</body>
</html>
