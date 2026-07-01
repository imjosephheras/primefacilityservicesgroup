<?php
require_once __DIR__ . '/includes/config.php';
startSession();

// Already logged in
if (!empty($_SESSION['user_id'])) {
    header('Location: ' . APP_URL . '/dashboard.php');
    exit;
}

$error    = $_SESSION['login_error']    ?? '';
$prefill  = $_SESSION['login_email']    ?? '';
$redirect = $_SESSION['login_redirect'] ?? APP_URL . '/dashboard.php';
$logout   = isset($_GET['logout']);

unset($_SESSION['login_error'], $_SESSION['login_email'], $_SESSION['login_redirect']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login — PRIME Facility Services</title>
    <meta name="robots" content="noindex, nofollow">
    <link rel="icon" href="/assets/logos/logo-prime.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --white:       #ffffff;
            --off-white:   #f8f8f6;
            --gray-50:     #f5f5f3;
            --gray-100:    #efefed;
            --gray-200:    #e0e0dd;
            --gray-300:    #c8c8c4;
            --gray-400:    #9a9a96;
            --gray-500:    #6e6e6a;
            --gray-600:    #4a4a46;
            --gray-900:    #111110;
            --blue:        #1a5cff;
            --blue-light:  #e8f0ff;
            --blue-dark:   #1447d4;
            --red:         #dc2626;
            --red-light:   #fef2f2;
            --green:       #16a34a;
            --green-light: #f0fdf4;
            --shadow-sm:   0 2px 8px rgba(0,0,0,0.08);
            --shadow-md:   0 8px 24px rgba(0,0,0,0.10);
            --font:        'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            --radius:      12px;
        }

        html { height: 100%; }

        body {
            min-height: 100%;
            background: var(--gray-50);
            color: var(--gray-900);
            font-family: var(--font);
            font-size: 16px;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            display: flex;
            flex-direction: column;
        }

        /* ── NAV ── */
        .nav {
            position: fixed;
            top: 0; left: 0; right: 0;
            z-index: 100;
            background: rgba(255,255,255,0.92);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--gray-100);
            height: 64px;
            display: flex;
            align-items: center;
            padding: 0 32px;
        }
        .nav a {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .nav img { height: 28px; width: auto; }
        .nav-brand {
            font-size: 17px;
            font-weight: 700;
            letter-spacing: -0.04em;
            color: var(--gray-900);
        }

        /* ── MAIN ── */
        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 96px 20px 48px;
        }

        .login-card {
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: 20px;
            box-shadow: var(--shadow-md);
            padding: 48px 40px;
            width: 100%;
            max-width: 440px;
        }

        .login-header {
            margin-bottom: 32px;
        }
        .login-header h1 {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.04em;
            color: var(--gray-900);
            margin-bottom: 6px;
        }
        .login-header p {
            font-size: 14px;
            color: var(--gray-500);
        }

        /* ── ALERTS ── */
        .alert {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 24px;
        }
        .alert-error {
            background: var(--red-light);
            border: 1px solid #fecaca;
            color: var(--red);
        }
        .alert-success {
            background: var(--green-light);
            border: 1px solid #bbf7d0;
            color: var(--green);
        }
        .alert-icon { flex-shrink: 0; margin-top: 1px; }

        /* ── FORM ── */
        .form-group {
            margin-bottom: 20px;
        }
        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: var(--gray-600);
            margin-bottom: 8px;
            letter-spacing: 0.01em;
        }
        .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 1.5px solid var(--gray-200);
            border-radius: var(--radius);
            font-size: 15px;
            font-family: var(--font);
            color: var(--gray-900);
            background: var(--white);
            transition: border-color 0.15s, box-shadow 0.15s;
            outline: none;
        }
        .form-input:focus {
            border-color: var(--blue);
            box-shadow: 0 0 0 3px rgba(26,92,255,0.12);
        }
        .form-input::placeholder { color: var(--gray-400); }

        /* password wrapper */
        .input-wrapper { position: relative; }
        .toggle-pw {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: var(--gray-400);
            display: flex;
            align-items: center;
            padding: 0;
            transition: color 0.15s;
        }
        .toggle-pw:hover { color: var(--gray-600); }

        .btn-login {
            width: 100%;
            padding: 14px;
            background: var(--blue);
            color: var(--white);
            border: none;
            border-radius: var(--radius);
            font-size: 15px;
            font-weight: 600;
            font-family: var(--font);
            cursor: pointer;
            transition: background 0.15s, transform 0.1s;
            margin-top: 8px;
        }
        .btn-login:hover  { background: var(--blue-dark); }
        .btn-login:active { transform: scale(0.99); }
        .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── FOOTER ── */
        footer {
            text-align: center;
            padding: 24px;
            font-size: 13px;
            color: var(--gray-400);
        }
        footer a {
            color: var(--gray-500);
            text-decoration: none;
        }
        footer a:hover { color: var(--gray-900); }

        @media (max-width: 480px) {
            .login-card { padding: 32px 24px; }
            .nav { padding: 0 20px; }
        }
    </style>
</head>
<body>

<nav class="nav">
    <a href="/facility/hood-cleaning/">
        <img src="/assets/logos/logo-prime.png" alt="PRIME"
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
        <span class="nav-brand" style="display:none;">PRIME</span>
    </a>
</nav>

<main>
    <div class="login-card">
        <div class="login-header">
            <h1>Welcome back</h1>
            <p>Sign in to your PRIME account</p>
        </div>

        <?php if ($logout): ?>
        <div class="alert alert-success">
            <svg class="alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 4.5L6.5 11.5L3 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            You have been signed out successfully.
        </div>
        <?php elseif ($error !== ''): ?>
        <div class="alert alert-error" role="alert">
            <svg class="alert-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?>
        </div>
        <?php endif; ?>

        <form method="POST" action="api/auth.php" id="loginForm" novalidate>
            <input type="hidden" name="redirect" value="<?= htmlspecialchars($redirect, ENT_QUOTES, 'UTF-8') ?>">

            <div class="form-group">
                <label class="form-label" for="email">Email address</label>
                <input
                    class="form-input"
                    type="email"
                    id="email"
                    name="email"
                    value="<?= htmlspecialchars($prefill, ENT_QUOTES, 'UTF-8') ?>"
                    placeholder="you@example.com"
                    autocomplete="email"
                    required
                    autofocus
                >
            </div>

            <div class="form-group">
                <label class="form-label" for="password">Password</label>
                <div class="input-wrapper">
                    <input
                        class="form-input"
                        type="password"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        autocomplete="current-password"
                        required
                        style="padding-right: 44px;"
                    >
                    <button type="button" class="toggle-pw" id="togglePw" aria-label="Show password">
                        <svg id="eyeOpen" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg id="eyeClosed" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn-login" id="submitBtn">Sign in</button>
        </form>
    </div>
</main>

<footer>
    <p>© 2025 Prime Facility Services Group &nbsp;·&nbsp; <a href="/pages/privacy/">Privacy Policy</a></p>
</footer>

<script>
    // Toggle password visibility
    const togglePw  = document.getElementById('togglePw');
    const pwInput   = document.getElementById('password');
    const eyeOpen   = document.getElementById('eyeOpen');
    const eyeClosed = document.getElementById('eyeClosed');

    togglePw.addEventListener('click', () => {
        const isText = pwInput.type === 'text';
        pwInput.type = isText ? 'password' : 'text';
        eyeOpen.style.display   = isText ? '' : 'none';
        eyeClosed.style.display = isText ? 'none' : '';
    });

    // Disable button on submit to prevent double-submit
    document.getElementById('loginForm').addEventListener('submit', function () {
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('submitBtn').textContent = 'Signing in…';
    });
</script>
</body>
</html>
