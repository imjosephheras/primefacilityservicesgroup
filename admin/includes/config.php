<?php
/* ─────────────────────────────────────────────
   Visitor Tracking – Core Configuration
   ───────────────────────────────────────────── */

define('VT_SESSION_NAME', 'vt_admin_session');
define('VT_DB_PATH',      __DIR__ . '/../db/visitor_tracking.db');
define('VT_BASE_URL',     '/primefacilityservicesgroup/admin');
define('ADMIN_USER',      'admin');
define('ADMIN_PASS_HASH', '$2y$12$s8wJ2ecn7DVC1HpAlrhJ7uDyazQfXY63iVxElHuS8TMeyIcTdxPiG'); // admin123

/* ── Session ──────────────────────────────────────────────────────────── */

function vtSession(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name(VT_SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 7200,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function vtRequireLogin(): void {
    vtSession();
    if (empty($_SESSION['vt_logged_in'])) {
        header('Location: ' . VT_BASE_URL . '/login/');
        exit;
    }
}

/* ── Database ─────────────────────────────────────────────────────────── */

function vtGetDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dir = dirname(VT_DB_PATH);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $pdo = new PDO('sqlite:' . VT_DB_PATH, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL');
        vtSetupDB($pdo);
    }
    return $pdo;
}

function vtSetupDB(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS vt_visits (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            visited_at   DATETIME DEFAULT (datetime('now')),
            visitor_id   TEXT,
            session_id   TEXT,
            ip_address   TEXT,
            country      TEXT,
            state        TEXT,
            city         TEXT,
            isp          TEXT,
            browser      TEXT,
            browser_ver  TEXT,
            os           TEXT,
            device       TEXT,
            user_agent   TEXT,
            url_visited  TEXT,
            referer      TEXT,
            language     TEXT,
            timestamp    INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_vt_visited_at  ON vt_visits(visited_at);
        CREATE INDEX IF NOT EXISTS idx_vt_visitor_id  ON vt_visits(visitor_id);
        CREATE INDEX IF NOT EXISTS idx_vt_session_id  ON vt_visits(session_id);
        CREATE INDEX IF NOT EXISTS idx_vt_ip          ON vt_visits(ip_address);
        CREATE INDEX IF NOT EXISTS idx_vt_country     ON vt_visits(country);

        CREATE TABLE IF NOT EXISTS vt_login_history (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            logged_at    DATETIME DEFAULT (datetime('now')),
            username     TEXT,
            ip_address   TEXT,
            country      TEXT,
            state        TEXT,
            city         TEXT,
            isp          TEXT,
            browser      TEXT,
            os           TEXT,
            device       TEXT,
            latitude     REAL,
            longitude    REAL,
            accuracy     REAL,
            geo_status   TEXT,
            login_status TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_lh_logged_at ON vt_login_history(logged_at);
    ");
}

/* ── UUID Generator ───────────────────────────────────────────────────── */

function vtUuid(): string {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/* ── IP Detection ─────────────────────────────────────────────────────── */

function vtGetRealIP(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

/* ── Geo-IP ───────────────────────────────────────────────────────────── */

function vtGeoIP(string $ip): array {
    $empty = ['country' => '', 'state' => '', 'city' => '', 'isp' => ''];

    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return ['country' => 'Local Network', 'state' => '', 'city' => 'Local', 'isp' => 'Local Network'];
    }

    $ctx  = stream_context_create(['http' => ['timeout' => 3, 'ignore_errors' => true]]);
    $json = @file_get_contents("http://ip-api.com/json/{$ip}?fields=country,regionName,city,isp,status", false, $ctx);

    if ($json) {
        $data = json_decode($json, true);
        if (($data['status'] ?? '') === 'success') {
            return [
                'country' => $data['country']     ?? '',
                'state'   => $data['regionName']  ?? '',
                'city'    => $data['city']        ?? '',
                'isp'     => $data['isp']         ?? '',
            ];
        }
    }

    return $empty;
}

/* ── Browser Detection ────────────────────────────────────────────────── */

function vtDetectBrowser(string $ua): array {
    $browser = 'Unknown';
    $ver     = '';

    if (preg_match('/Edg\/([0-9.]+)/', $ua, $m))        { $browser = 'Microsoft Edge';   $ver = $m[1]; }
    elseif (preg_match('/OPR\/([0-9.]+)/', $ua, $m))    { $browser = 'Opera';             $ver = $m[1]; }
    elseif (preg_match('/Chrome\/([0-9.]+)/', $ua, $m)) { $browser = 'Google Chrome';     $ver = $m[1]; }
    elseif (preg_match('/Firefox\/([0-9.]+)/', $ua, $m)){ $browser = 'Mozilla Firefox';   $ver = $m[1]; }
    elseif (preg_match('/Version\/([0-9.]+).*Safari/', $ua, $m)) { $browser = 'Safari';   $ver = $m[1]; }
    elseif (preg_match('/MSIE ([0-9.]+)/', $ua, $m))    { $browser = 'Internet Explorer'; $ver = $m[1]; }
    elseif (preg_match('/Trident\/.*rv:([0-9.]+)/', $ua, $m)) { $browser = 'Internet Explorer'; $ver = $m[1]; }

    return ['browser' => $browser, 'ver' => $ver];
}

/* ── OS Detection ─────────────────────────────────────────────────────── */

function vtDetectOS(string $ua): string {
    if (str_contains($ua, 'Windows NT'))  return 'Windows';
    if (str_contains($ua, 'Mac OS X'))    return 'macOS';
    if (str_contains($ua, 'iPhone'))      return 'iOS';
    if (str_contains($ua, 'iPad'))        return 'iOS';
    if (str_contains($ua, 'Android'))     return 'Android';
    if (str_contains($ua, 'Linux'))       return 'Linux';
    if (str_contains($ua, 'CrOS'))        return 'Chrome OS';
    return 'Unknown';
}

/* ── Device Detection ─────────────────────────────────────────────────── */

function vtDetectDevice(string $ua): string {
    if (preg_match('/(iPhone|Android.*Mobile|Mobile|BlackBerry|IEMobile)/i', $ua)) return 'Mobile';
    if (preg_match('/(iPad|Android(?!.*Mobile)|Tablet)/i', $ua))                   return 'Tablet';
    return 'Desktop';
}

/* ── Bot Detection ────────────────────────────────────────────────────── */

function vtIsBot(string $ua): bool {
    return (bool) preg_match(
        '/(bot|crawl|spider|slurp|mediapartners|bingpreview|facebookexternalhit|whatsapp|twitterbot|linkedinbot|googlebot|baiduspider|yandexbot|duckduckbot|sogou|exabot|ia_archiver)/i',
        $ua
    );
}
