<?php
/* ─────────────────────────────────────────────
   Visitor Tracker
   Include this file at the top of any PHP page,
   or request it as a 1×1 transparent pixel:
     <img src="/admin/visitors/tracker.php" style="display:none" aria-hidden="true">
   ───────────────────────────────────────────── */

require_once __DIR__ . '/../includes/config.php';

/* ── Skip bots ───────────────────────────────── */
$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if (vtIsBot($ua) || empty($ua)) {
    vtPixelResponse();
}

/* ── Visitor ID cookie (permanent, 1 year) ───── */
$visitorId = $_COOKIE['vt_vid'] ?? null;
if (!$visitorId || !preg_match('/^[0-9a-f\-]{36}$/', $visitorId)) {
    $visitorId = vtUuid();
    setcookie('vt_vid', $visitorId, [
        'expires'  => time() + 365 * 24 * 3600,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/* ── Session ID cookie (per visit, session lifetime) ─ */
$sessionId = $_COOKIE['vt_sid'] ?? null;
if (!$sessionId || !preg_match('/^[0-9a-f\-]{36}$/', $sessionId)) {
    $sessionId = vtUuid();
    setcookie('vt_sid', $sessionId, [
        'expires'  => 0,
        'path'     => '/',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/* ── Gather data ────────────────────────────── */
$ip       = vtGetRealIP();
$geo      = vtGeoIP($ip);
$bInfo    = vtDetectBrowser($ua);
$os       = vtDetectOS($ua);
$device   = vtDetectDevice($ua);
$url      = $_SERVER['HTTP_REFERER'] ?? ($_GET['url'] ?? '');
$referer  = $_SERVER['HTTP_REFERER'] ?? ($_GET['ref'] ?? '');
$language = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'unknown', 0, 35);

/* ── Determine actual visited URL ────────────── */
if (isset($_GET['url'])) {
    $url = filter_var($_GET['url'], FILTER_SANITIZE_URL);
} else {
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host   = $_SERVER['HTTP_HOST'] ?? '';
    $uri    = $_SERVER['REQUEST_URI'] ?? '';
    $url    = $host ? $scheme . '://' . $host . $uri : $uri;
}

/* ── Determine referer ───────────────────────── */
$referer = $_SERVER['HTTP_REFERER'] ?? ($_GET['ref'] ?? '');

/* ── Insert visit ───────────────────────────── */
try {
    $db   = vtGetDB();
    $stmt = $db->prepare("
        INSERT INTO vt_visits
            (visitor_id, session_id, ip_address, country, state, city, isp,
             browser, browser_ver, os, device, user_agent, url_visited, referer, language, timestamp)
        VALUES
            (:vid, :sid, :ip, :country, :state, :city, :isp,
             :browser, :browser_ver, :os, :device, :ua, :url, :ref, :lang, :ts)
    ");
    $stmt->execute([
        ':vid'         => $visitorId,
        ':sid'         => $sessionId,
        ':ip'          => $ip,
        ':country'     => $geo['country'],
        ':state'       => $geo['state'],
        ':city'        => $geo['city'],
        ':isp'         => $geo['isp'],
        ':browser'     => $bInfo['browser'],
        ':browser_ver' => $bInfo['ver'],
        ':os'          => $os,
        ':device'      => $device,
        ':ua'          => $ua,
        ':url'         => $url,
        ':ref'         => $referer,
        ':lang'        => $language,
        ':ts'          => time(),
    ]);
} catch (PDOException $e) {
    // Fail silently — never break the user experience
}

/* ── Respond: pixel if direct request, nothing if included ── */
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    vtPixelResponse();
}

/* ── Return 1×1 transparent GIF (for pixel requests) ── */
function vtPixelResponse(): never {
    if (!headers_sent()) {
        header('Content-Type: image/gif');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');
    }
    echo "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b";
    exit;
}
