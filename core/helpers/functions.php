<?php
/**
 * Core Helper Functions
 *
 * This file contains utility functions used throughout the application.
 */

/**
 * Sanitize user input to prevent XSS attacks
 *
 * @param string $input The input string to sanitize
 * @return string The sanitized string
 */
function sanitize_input($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Escape output safely
 *
 * @param string $text The text to escape
 * @return string The escaped text
 */
function escape_output($text) {
    return htmlspecialchars($text, ENT_QUOTES, 'UTF-8');
}

/**
 * Check if value is empty
 *
 * @param mixed $value The value to check
 * @return bool True if empty, false otherwise
 */
function is_empty($value) {
    return empty($value) || (is_string($value) && trim($value) === '');
}

/**
 * Get the current page URL
 *
 * @return string The current page URL
 */
function get_current_url() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    return $protocol . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
}

/**
 * Redirect to a URL
 *
 * @param string $url The URL to redirect to
 * @param int $statusCode The HTTP status code (default: 302)
 * @return void
 */
function redirect($url, $statusCode = 302) {
    header("Location: {$url}", true, $statusCode);
    exit;
}

/**
 * Check if the request is AJAX
 *
 * @return bool True if AJAX request, false otherwise
 */
function is_ajax() {
    return !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
}

/**
 * Get the client's IP address
 *
 * @return string The client's IP address
 */
function get_client_ip() {
    $ip = '';
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
        $ip = $_SERVER['HTTP_X_REAL_IP'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    return trim($ip);
}

/**
 * Log a message to a file
 *
 * @param string $message The message to log
 * @param string $level The log level (default: 'INFO')
 * @return void
 */
function log_message($message, $level = 'INFO') {
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }

    $logFile = $logDir . '/app.log';
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "[{$timestamp}] [{$level}] {$message}\n";

    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Format a date string
 *
 * @param string $date The date string
 * @param string $format The desired format (default: 'Y-m-d H:i:s')
 * @return string The formatted date
 */
function format_date($date, $format = 'Y-m-d H:i:s') {
    try {
        $datetime = new DateTime($date);
        return $datetime->format($format);
    } catch (Exception $e) {
        return $date;
    }
}

/**
 * Convert a string to a slug
 *
 * @param string $string The string to convert
 * @return string The slug
 */
function create_slug($string) {
    $string = strtolower(trim($string));
    $string = preg_replace('/[^a-z0-9]+/', '-', $string);
    return trim($string, '-');
}
