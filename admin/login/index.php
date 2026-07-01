<?php
require_once __DIR__ . '/../includes/config.php';
vtSession();

/* ── Already logged in ─────────────────────── */
if (!empty($_SESSION['vt_logged_in'])) {
    header('Location: ' . VT_BASE_URL . '/dashboard/');
    exit;
}

/* ── Geo-IP helper for login history ──────── */
function recordLogin(string $username, bool $success, ?float $lat, ?float $lng, ?float $acc, string $geoStatus): void {
    $ip    = vtGetRealIP();
    $geo   = vtGeoIP($ip);
    $ua    = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $b     = vtDetectBrowser($ua);
    $os    = vtDetectOS($ua);
    $dev   = vtDetectDevice($ua);

    try {
        $db   = vtGetDB();
        $stmt = $db->prepare("
            INSERT INTO vt_login_history
                (username, ip_address, country, state, city, isp, browser, os, device,
                 latitude, longitude, accuracy, geo_status, login_status)
            VALUES
                (:user, :ip, :country, :state, :city, :isp, :browser, :os, :device,
                 :lat, :lng, :acc, :geo, :status)
        ");
        $stmt->execute([
            ':user'    => $username,
            ':ip'      => $ip,
            ':country' => $geo['country'],
            ':state'   => $geo['state'],
            ':city'    => $geo['city'],
            ':isp'     => $geo['isp'],
            ':browser' => $b['browser'],
            ':os'      => $os,
            ':device'  => $dev,
            ':lat'     => $lat,
            ':lng'     => $lng,
            ':acc'     => $acc,
            ':geo'     => $geoStatus,
            ':status'  => $success ? 'Success' : 'Failed',
        ]);
    } catch (PDOException $e) { /* fail silently */ }
}

$error = '';
$step  = 'login'; // 'login' | 'geo'

/* ── Handle Step 2: geo result + finalize session ── */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['geo_done'])) {
    vtSession();
    if (!empty($_SESSION['vt_pending_login'])) {
        $lat       = isset($_POST['latitude'])  ? (float)$_POST['latitude']  : null;
        $lng       = isset($_POST['longitude']) ? (float)$_POST['longitude'] : null;
        $acc       = isset($_POST['accuracy'])  ? (float)$_POST['accuracy']  : null;
        $geoStatus = htmlspecialchars(trim($_POST['geo_status'] ?? 'denied'), ENT_QUOTES);

        recordLogin($_SESSION['vt_pending_user'], true, $lat, $lng, $acc, $geoStatus);

        $_SESSION['vt_logged_in'] = true;
        $_SESSION['vt_user']      = $_SESSION['vt_pending_user'];
        unset($_SESSION['vt_pending_login'], $_SESSION['vt_pending_user']);

        header('Location: ' . VT_BASE_URL . '/dashboard/');
        exit;
    }
}

/* ── Handle Step 1: credential check ──────── */
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['username'])) {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === ADMIN_USER && password_verify($password, ADMIN_PASS_HASH)) {
        session_regenerate_id(true);
        $_SESSION['vt_pending_login'] = true;
        $_SESSION['vt_pending_user']  = $username;
        $step = 'geo';
    } else {
        recordLogin($username, false, null, null, null, 'n/a');
        $error = 'Invalid username or password.';
    }
}

if (!empty($_SESSION['vt_pending_login'])) {
    $step = 'geo';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Login — Prime Facility Services Group</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#0f1729;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:#fff;border-radius:16px;padding:44px 40px;width:100%;max-width:420px;box-shadow:0 25px 60px rgba(0,0,0,.4)}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:28px;justify-content:center}
.logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#1a5cff,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center}
.logo-icon svg{width:24px;height:24px;fill:#fff}
.logo-text{font-size:17px;font-weight:700;color:#0f1729;line-height:1.2}
.logo-text span{display:block;font-size:11px;font-weight:400;color:#64748b}
h1{font-size:22px;font-weight:700;color:#0f1729;margin-bottom:6px;text-align:center}
p.sub{font-size:13.5px;color:#64748b;text-align:center;margin-bottom:26px}
label{display:block;font-size:12.5px;font-weight:500;color:#374151;margin-bottom:5px}
input[type=text],input[type=password]{width:100%;padding:11px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;font-family:inherit;outline:none;transition:border-color .2s;color:#1e293b}
input:focus{border-color:#1a5cff;box-shadow:0 0 0 3px rgba(26,92,255,.1)}
.field{margin-bottom:16px}
.btn{width:100%;padding:13px;background:#1a5cff;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .2s;margin-top:4px}
.btn:hover{background:#1447d4}
.btn:disabled{background:#94a3b8;cursor:not-allowed}
.error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:16px}

/* Geo step */
.geo-box{text-align:center}
.geo-icon{width:72px;height:72px;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px}
.geo-icon svg{width:36px;height:36px;color:#0ea5e9}
.geo-box h2{font-size:20px;font-weight:700;color:#0f1729;margin-bottom:8px}
.geo-box p{font-size:13.5px;color:#64748b;line-height:1.6;margin-bottom:24px}
.btn-geo{width:100%;padding:13px;background:#0ea5e9;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;margin-bottom:10px;transition:background .2s}
.btn-geo:hover{background:#0284c7}
.btn-skip{width:100%;padding:11px;background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13.5px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .2s}
.btn-skip:hover{background:#f1f5f9}
.geo-status{font-size:12.5px;color:#64748b;margin-top:14px;min-height:18px;text-align:center}
.geo-status.success{color:#16a34a}
.geo-status.error{color:#dc2626}
.spinner{display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px}
@keyframes spin{to{transform:rotate(360deg)}}
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

  <?php if ($step === 'login'): ?>
  <!-- ── Step 1: Credentials ── -->
  <h1>Welcome back</h1>
  <p class="sub">Sign in to your admin account</p>
  <?php if ($error): ?>
  <div class="error"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>
  <form method="POST" autocomplete="off">
    <div class="field">
      <label for="username">Username</label>
      <input type="text" id="username" name="username" value="<?= htmlspecialchars($_POST['username'] ?? '') ?>" placeholder="admin" required autofocus>
    </div>
    <div class="field">
      <label for="password">Password</label>
      <input type="password" id="password" name="password" placeholder="••••••••" required>
    </div>
    <button class="btn" type="submit">Sign In</button>
  </form>

  <?php else: ?>
  <!-- ── Step 2: Geolocation ── -->
  <div class="geo-box">
    <div class="geo-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
    <h2>Security Check</h2>
    <p>Allow us to access your device location? This is optional and used exclusively for security logging.</p>

    <form id="geo-form" method="POST">
      <input type="hidden" name="geo_done" value="1">
      <input type="hidden" id="f-lat" name="latitude" value="">
      <input type="hidden" id="f-lng" name="longitude" value="">
      <input type="hidden" id="f-acc" name="accuracy" value="">
      <input type="hidden" id="f-geo" name="geo_status" value="denied">

      <button type="button" class="btn-geo" id="btn-allow" onclick="requestGeo()">
        Allow Location Access
      </button>
      <button type="button" class="btn-skip" id="btn-skip" onclick="skipGeo()">
        Skip — Continue Without Location
      </button>
      <div class="geo-status" id="geo-msg"></div>
    </form>
  </div>

  <script>
  function requestGeo() {
    const btn   = document.getElementById('btn-allow');
    const msg   = document.getElementById('geo-msg');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Requesting…';
    msg.className = 'geo-status';
    msg.textContent = '';

    if (!navigator.geolocation) {
      msg.className = 'geo-status error';
      msg.textContent = 'Geolocation not supported by this browser.';
      btn.disabled = false;
      btn.textContent = 'Allow Location Access';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        document.getElementById('f-lat').value = pos.coords.latitude;
        document.getElementById('f-lng').value = pos.coords.longitude;
        document.getElementById('f-acc').value = pos.coords.accuracy;
        document.getElementById('f-geo').value = 'granted';
        msg.className = 'geo-status success';
        msg.textContent = 'Location received. Signing you in…';
        document.getElementById('geo-form').submit();
      },
      function(err) {
        document.getElementById('f-geo').value = 'denied';
        msg.className = 'geo-status error';
        msg.textContent = 'Location access denied. Continuing…';
        setTimeout(function() { document.getElementById('geo-form').submit(); }, 1200);
      },
      { timeout: 10000 }
    );
  }

  function skipGeo() {
    document.getElementById('f-geo').value = 'skipped';
    document.getElementById('geo-form').submit();
  }
  </script>
  <?php endif; ?>
</div>
</body>
</html>
