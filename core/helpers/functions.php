<?php
/**
 * Shared helper functions
 * Prime Facility Services Group
 */

/**
 * Sanitize and escape a string for HTML output.
 */
function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Return a JSON response and exit.
 */
function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Redirect to a URL and exit.
 */
function redirect(string $url, int $status = 302): void
{
    header('Location: ' . $url, true, $status);
    exit;
}

/**
 * Return true if the current request is a POST.
 */
function isPost(): bool
{
    return $_SERVER['REQUEST_METHOD'] === 'POST';
}

/**
 * Return the current URL path.
 */
function currentPath(): string
{
    return parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
}

/**
 * Log a message to the storage/logs directory.
 */
function appLog(string $message, string $level = 'info'): void
{
    $logFile = (defined('LOGS_PATH') ? LOGS_PATH : __DIR__ . '/../../storage/logs')
        . '/app-' . date('Y-m-d') . '.log';
    $line = sprintf("[%s] [%s] %s\n", date('Y-m-d H:i:s'), strtoupper($level), $message);
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

/**
 * Generate a URL for a named route.
 * This function maps route names to their corresponding paths.
 */
function route(string $name, array $parameters = []): string
{
    $routes = [
        'pages.about' => '/pages/about/',
        'pages.contact' => '/pages/contact/',
        'pages.privacy' => '/pages/privacy/',
    ];

    if (!isset($routes[$name])) {
        return '/';
    }

    $path = $routes[$name];

    foreach ($parameters as $key => $value) {
        $path = str_replace('{' . $key . '}', (string)$value, $path);
    }

    return $path;
}
