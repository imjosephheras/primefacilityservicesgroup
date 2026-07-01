<?php
/**
 * Central application configuration
 * Prime Facility Services Group
 */

// ── Environment detection ────────────────────────────────────────────────────
define('APP_ENV', $_ENV['APP_ENV'] ?? getenv('APP_ENV') ?: 'production');
define('APP_DEBUG', APP_ENV === 'development');

// ── Site identity ────────────────────────────────────────────────────────────
define('SITE_NAME', 'Prime Facility Services Group');
define('SITE_URL', 'https://primefacilityservicesgroup.com');

// ── Directory paths ──────────────────────────────────────────────────────────
define('ROOT_PATH',    dirname(__DIR__, 2));
define('CORE_PATH',    __DIR__ . '/..');
define('STORAGE_PATH', ROOT_PATH . '/storage');
define('LOGS_PATH',    STORAGE_PATH . '/logs');
define('UPLOADS_PATH', STORAGE_PATH . '/uploads');

// ── Asset paths (web-root relative) ─────────────────────────────────────────
define('ASSETS_URL',  '/assets');
define('CSS_URL',     ASSETS_URL . '/css');
define('JS_URL',      ASSETS_URL . '/js');
define('IMAGES_URL',  ASSETS_URL . '/images');
define('LOGOS_URL',   ASSETS_URL . '/logos');
define('MEDIA_URL',   ASSETS_URL . '/media');

// ── Timezone ─────────────────────────────────────────────────────────────────
date_default_timezone_set('America/Chicago');
