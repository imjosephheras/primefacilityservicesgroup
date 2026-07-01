<?php
define('VT_SESSION_NAME', 'vt_admin_session');
define('VT_DB_PATH', __DIR__ . '/db/visitor_tracking.db');
define('VT_BASE_URL', '/modules/admin/visitor_tracking');
define('ADMIN_USER', 'admin');
define('ADMIN_PASS', '123');

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
        header('Location: ' . VT_BASE_URL . '/login.php');
        exit;
    }
}

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
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            visited_at  DATETIME DEFAULT (datetime('now')),
            ip_address  TEXT,
            country     TEXT,
            city        TEXT,
            isp         TEXT,
            browser     TEXT,
            browser_ver TEXT,
            os          TEXT,
            device      TEXT,
            url_visited TEXT,
            referer     TEXT,
            user_agent  TEXT,
            username    TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_visited_at  ON vt_visits(visited_at);
        CREATE INDEX IF NOT EXISTS idx_ip          ON vt_visits(ip_address);
        CREATE INDEX IF NOT EXISTS idx_country     ON vt_visits(country);
        CREATE INDEX IF NOT EXISTS idx_browser     ON vt_visits(browser);
    ");
}

function vtDetectBrowser(string $ua): array {
    $browser = 'Unknown';
    $ver     = '';
    if (preg_match('/Edg\/([0-9.]+)/', $ua, $m))       { $browser = 'Microsoft Edge';   $ver = $m[1]; }
    elseif (preg_match('/OPR\/([0-9.]+)/', $ua, $m))   { $browser = 'Opera';             $ver = $m[1]; }
    elseif (preg_match('/Chrome\/([0-9.]+)/', $ua, $m)){ $browser = 'Google Chrome';     $ver = $m[1]; }
    elseif (preg_match('/Firefox\/([0-9.]+)/', $ua, $m)){ $browser = 'Mozilla Firefox';  $ver = $m[1]; }
    elseif (preg_match('/Safari\/([0-9.]+)/', $ua, $m)){ $browser = 'Safari';            $ver = $m[1]; }
    elseif (preg_match('/MSIE ([0-9.]+)/', $ua, $m))   { $browser = 'Internet Explorer'; $ver = $m[1]; }
    return ['browser' => $browser, 'ver' => $ver];
}

function vtDetectOS(string $ua): string {
    if (str_contains($ua, 'Windows NT 10'))   return 'Windows';
    if (str_contains($ua, 'Windows'))         return 'Windows';
    if (str_contains($ua, 'Mac OS X'))        return 'macOS';
    if (str_contains($ua, 'iPhone'))          return 'iOS';
    if (str_contains($ua, 'iPad'))            return 'iOS';
    if (str_contains($ua, 'Android'))         return 'Android';
    if (str_contains($ua, 'Linux'))           return 'Linux';
    return 'Unknown';
}

function vtDetectDevice(string $ua): string {
    if (preg_match('/(iPhone|iPad|iPod|Android.*Mobile|Mobile)/i', $ua)) return 'Mobile';
    if (preg_match('/(iPad|Android(?!.*Mobile)|Tablet)/i', $ua))         return 'Tablet';
    return 'Desktop';
}

function vtGetRealIP(): string {
    foreach (['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','HTTP_X_REAL_IP','REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            $ip = trim(explode(',', $_SERVER[$key])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
        }
    }
    return '0.0.0.0';
}

function vtGeoIP(string $ip): array {
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        return ['country' => 'Local Network', 'city' => 'Local', 'isp' => 'Local Network'];
    }
    $ctx  = stream_context_create(['http' => ['timeout' => 3]]);
    $json = @file_get_contents("http://ip-api.com/json/{$ip}?fields=country,city,isp", false, $ctx);
    if ($json) {
        $data = json_decode($json, true);
        if (!empty($data['country'])) {
            return ['country' => $data['country'], 'city' => $data['city'] ?? '', 'isp' => $data['isp'] ?? ''];
        }
    }
    return ['country' => 'Unknown', 'city' => '', 'isp' => ''];
}
