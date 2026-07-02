<?php
/**
 * SMTP Configuration - Load from environment variables
 * Credentials are stored in .env file, NOT in this file
 */

// Load environment variables from .env file if it exists
$envFile = dirname(__DIR__, 2) . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            // Remove quotes if present
            if ((substr($value, 0, 1) === '"' && substr($value, -1) === '"') ||
                (substr($value, 0, 1) === "'" && substr($value, -1) === "'")) {
                $value = substr($value, 1, -1);
            }
            if (!array_key_exists($key, $_ENV) && !getenv($key)) {
                putenv("$key=$value");
            }
        }
    }
}

// Get SMTP configuration from environment variables
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp-relay.brevo.com');
define('SMTP_PORT', (int)(getenv('SMTP_PORT') ?: 587));
define('SMTP_USERNAME', getenv('SMTP_USERNAME'));
define('SMTP_PASSWORD', getenv('SMTP_PASSWORD'));
define('SMTP_ENCRYPTION', 'tls');
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL'));
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: 'Prime Facility Services Group');

// Email recipients (can be multiple, comma-separated)
define('EMAIL_TO', getenv('EMAIL_TO'));

// Validate required SMTP settings
if (!SMTP_USERNAME || !SMTP_PASSWORD || !SMTP_FROM_EMAIL || !EMAIL_TO) {
    error_log('ERROR: Missing SMTP configuration in .env file');
}
?>
