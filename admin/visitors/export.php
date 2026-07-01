<?php
require_once __DIR__ . '/../includes/config.php';
vtRequireLogin();

$db = vtGetDB();

$fIp      = trim($_GET['ip']      ?? '');
$fCountry = trim($_GET['country'] ?? '');
$fUrl     = trim($_GET['url']     ?? '');
$fBrowser = trim($_GET['browser'] ?? '');
$fDevice  = trim($_GET['device']  ?? '');
$fFrom    = trim($_GET['from']    ?? '');
$fTo      = trim($_GET['to']      ?? '');

$where  = [];
$params = [];
if ($fIp)      { $where[] = "ip_address LIKE :ip";      $params[':ip']  = "%$fIp%"; }
if ($fCountry) { $where[] = "country LIKE :country";     $params[':country'] = "%$fCountry%"; }
if ($fUrl)     { $where[] = "url_visited LIKE :url";     $params[':url'] = "%$fUrl%"; }
if ($fBrowser) { $where[] = "browser = :browser";        $params[':browser'] = $fBrowser; }
if ($fDevice)  { $where[] = "device = :device";          $params[':device']  = $fDevice; }
if ($fFrom)    { $where[] = "date(visited_at) >= :from"; $params[':from'] = $fFrom; }
if ($fTo)      { $where[] = "date(visited_at) <= :to";   $params[':to']   = $fTo; }
$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $db->prepare("SELECT * FROM vt_visits $whereSQL ORDER BY visited_at DESC LIMIT 50000");
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->execute();

$filename = 'visitor_log_' . date('Y-m-d_His') . '.csv';
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Cache-Control: no-cache');

$out = fopen('php://output', 'w');
fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
fputcsv($out, ['ID','Date/Time','IP Address','Country','City','ISP','Browser','Browser Version','OS','Device','URL Visited','Referer','User Agent','User']);
while ($row = $stmt->fetch()) {
    fputcsv($out, [
        $row['id'], $row['visited_at'], $row['ip_address'], $row['country'],
        $row['city'], $row['isp'], $row['browser'], $row['browser_ver'],
        $row['os'], $row['device'], $row['url_visited'], $row['referer'],
        $row['user_agent'], $row['username'],
    ]);
}
fclose($out);
exit;
