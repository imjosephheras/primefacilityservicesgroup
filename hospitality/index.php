<?php
/* Hospitality Division - Public Access Handler */

session_start();

require_once __DIR__ . '/../core/helpers/functions.php';

// ────────────────────────────────────────────────────────────────────────
// Public access - route to the appropriate division view
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
