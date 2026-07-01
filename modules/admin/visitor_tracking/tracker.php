<?php
/**
 * Visitor Tracker — include this file in any page you want to track,
 * OR call it via AJAX/pixel from the frontend.
 *
 * Usage (server-side include):
 *   <?php require_once '/path/to/modules/admin/visitor_tracking/tracker.php'; ?>
 *
 * Usage (pixel / AJAX):
 *   <img src="/modules/admin/visitor_tracking/tracker.php?url=...&ref=..." width="1" height="1" style="display:none">
 */

require_once __DIR__ . '/config.php';

$ua  = $_SERVER['HTTP_USER_AGENT'] ?? '';
$ip  = vtGetRealIP();
$url = $_GET['url'] ?? $_SERVER['REQUEST_URI'] ?? '';
$ref = $_GET['ref'] ?? $_SERVER['HTTP_REFERER'] ?? '';

// Skip tracking requests to the tracker itself / admin panel
$skipPatterns = ['/visitor_tracking/', '/tracker.php'];
foreach ($skipPatterns as $p) {
    if (str_contains($url, $p)) {
        if (headers_sent() === false) {
            header('Content-Type: image/gif');
            echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        }
        exit;
    }
}

// Bots filter
if (preg_match('/(bot|crawl|slurp|spider|curl|wget|python|java|perl|ruby|go-http|scan|check)/i', $ua)) {
    if (headers_sent() === false) {
        header('Content-Type: image/gif');
        echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    }
    exit;
}

$browserInfo = vtDetectBrowser($ua);
$os          = vtDetectOS($ua);
$device      = vtDetectDevice($ua);
$geo         = vtGeoIP($ip);

// Logged-in user (if using sessions from other modules)
$username = '';
if (session_status() !== PHP_SESSION_NONE || @session_start()) {
    $username = $_SESSION['username'] ?? $_SESSION['user'] ?? $_SESSION['admin_user'] ?? '';
}

try {
    $db = vtGetDB();
    $db->prepare("
        INSERT INTO vt_visits (ip_address, country, city, isp, browser, browser_ver, os, device, url_visited, referer, user_agent, username)
        VALUES (:ip, :country, :city, :isp, :browser, :bver, :os, :device, :url, :ref, :ua, :user)
    ")->execute([
        ':ip'      => $ip,
        ':country' => $geo['country'],
        ':city'    => $geo['city'],
        ':isp'     => $geo['isp'],
        ':browser' => $browserInfo['browser'],
        ':bver'    => $browserInfo['ver'],
        ':os'      => $os,
        ':device'  => $device,
        ':url'     => substr($url, 0, 500),
        ':ref'     => substr($ref, 0, 500),
        ':ua'      => substr($ua, 0, 500),
        ':user'    => $username,
    ]);
} catch (Exception $e) {
    // Silent fail — never break the tracked page
}

// If called directly (pixel mode), return 1×1 GIF
if (basename($_SERVER['SCRIPT_FILENAME']) === 'tracker.php') {
    header('Content-Type: image/gif');
    header('Cache-Control: no-cache, no-store');
    echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
    exit;
}
