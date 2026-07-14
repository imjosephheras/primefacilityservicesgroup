<?php
/* Hospitality Division - Authentication & Permission Handler */

session_start();

require_once __DIR__ . '/../core/helpers/functions.php';

// ────────────────────────────────────────────────────────────────────────
// Permission Check & Authentication
// ────────────────────────────────────────────────────────────────────────

$isAuthenticated = isset($_SESSION['hospitality_access']) && $_SESSION['hospitality_access'] === true;
$showPermissionPrompt = false;
$error = '';

// Handle permission request POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['grant_access'])) {
    $password = $_POST['access_password'] ?? '';
    // Simple password check - in production, use proper authentication
    if (!empty($password) && $password === 'hospitality2024') {
        $_SESSION['hospitality_access'] = true;
        $isAuthenticated = true;
    } else {
        $error = 'Invalid access code. Please try again.';
    }
}

// If not authenticated, show permission prompt
if (!$isAuthenticated) {
    // Check if this is an AJAX request for the permission modal
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode([
            'status' => 'forbidden',
            'message' => 'Access to this section requires permission.'
        ]);
        exit;
    }

    // Display permission prompt
    ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Access Required - Hospitality Division</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #03143A 0%, #0a1e4a 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 16px;
        }

        .permission-container {
            background: white;
            border-radius: 16px;
            padding: 48px 40px;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
        }

        .permission-header {
            text-align: center;
            margin-bottom: 32px;
        }

        .permission-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #C70532, #E91E63);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .permission-icon svg {
            width: 32px;
            height: 32px;
            color: white;
        }

        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #03143A;
            margin-bottom: 8px;
        }

        .permission-subtitle {
            font-size: 14px;
            color: #64748b;
            line-height: 1.6;
        }

        .permission-form {
            margin-top: 24px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 6px;
        }

        input[type="password"],
        input[type="text"] {
            width: 100%;
            padding: 12px 14px;
            border: 1.5px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
        }

        input[type="password"]:focus,
        input[type="text"]:focus {
            border-color: #C70532;
            box-shadow: 0 0 0 3px rgba(199, 5, 50, 0.1);
        }

        .form-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 12px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 16px;
            display: none;
        }

        .form-error.show {
            display: block;
        }

        .submit-btn {
            width: 100%;
            padding: 13px;
            background: linear-gradient(135deg, #C70532 0%, #E91E63 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(199, 5, 50, 0.3);
        }

        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(199, 5, 50, 0.4);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        .info-box {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            color: #0369a1;
            padding: 12px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-top: 20px;
            text-align: center;
        }

        .back-link {
            text-align: center;
            margin-top: 20px;
        }

        .back-link a {
            color: #64748b;
            text-decoration: none;
            font-size: 13px;
            transition: color 0.2s;
        }

        .back-link a:hover {
            color: #03143A;
        }
    </style>
</head>
<body>
    <div class="permission-container">
        <div class="permission-header">
            <div class="permission-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
            </div>
            <h1>Access Required</h1>
            <p class="permission-subtitle">
                This section requires permission to access. Please enter your access code to continue.
            </p>
        </div>

        <form method="POST" class="permission-form">
            <?php if (!empty($error)): ?>
            <div class="form-error show"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>

            <div class="form-group">
                <label for="access_password">Access Code</label>
                <input
                    type="password"
                    id="access_password"
                    name="access_password"
                    placeholder="Enter access code"
                    required
                    autofocus
                >
            </div>

            <input type="hidden" name="grant_access" value="1">
            <button type="submit" class="submit-btn">Verify Access</button>

            <div class="info-box">
                <strong>Need access?</strong> Contact our team at (713) 338-2553 for an access code.
            </div>
        </form>

        <div class="back-link">
            <a href="/primefacilityservicesgroup/">← Back to Home</a>
        </div>
    </div>
</body>
</html>
    <?php
    exit;
}

// ────────────────────────────────────────────────────────────────────────
// User is authenticated - route to the appropriate division view
// ────────────────────────────────────────────────────────────────────────

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$basePath = '/primefacilityservicesgroup/hospitality';

// Remove base path from request URI
if (strpos($requestUri, $basePath) === 0) {
    $route = substr($requestUri, strlen($basePath));
} else {
    $route = $requestUri;
}

// Clean up the route
$route = parse_url($route, PHP_URL_PATH);
$route = trim($route, '/');

// Parse the division and section
$parts = explode('/', $route);
$division = $parts[0] ?? 'staffing'; // Default to staffing
$section = $parts[1] ?? '';

// Validate division
$validDivisions = ['staffing', 'hiring', 'housekeeping', 'banquet', 'valet'];
if (!in_array($division, $validDivisions)) {
    $division = 'staffing';
}

// Route to the appropriate division view
$viewPath = __DIR__ . "/{$division}/views/index.html";

if (file_exists($viewPath)) {
    include $viewPath;
} else {
    // Fallback to staffing if division view not found
    include __DIR__ . '/staffing/views/index.html';
}
?>
