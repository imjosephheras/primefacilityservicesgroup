<?php
require_once __DIR__ . '/../includes/config.php';
vtRequireLogin();

$db     = vtGetDB();
$where  = [];
$params = [];

if (!empty($_GET['ip']))      { $where[] = "ip_address LIKE :ip";      $params[':ip']      = '%' . $_GET['ip'] . '%'; }
if (!empty($_GET['country'])) { $where[] = "country LIKE :country";     $params[':country'] = '%' . $_GET['country'] . '%'; }
if (!empty($_GET['url']))     { $where[] = "url_visited LIKE :url";     $params[':url']     = '%' . $_GET['url'] . '%'; }
if (!empty($_GET['browser'])) { $where[] = "browser = :browser";        $params[':browser'] = $_GET['browser']; }
if (!empty($_GET['device']))  { $where[] = "device = :device";          $params[':device']  = $_GET['device']; }
if (!empty($_GET['from']))    { $where[] = "date(visited_at) >= :from"; $params[':from']    = $_GET['from']; }
if (!empty($_GET['to']))      { $where[] = "date(visited_at) <= :to";   $params[':to']      = $_GET['to']; }

$sql  = "SELECT * FROM vt_visits" . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . " ORDER BY visited_at DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="visits_' . date('Y-m-d') . '.csv"');

$out = fopen('php://output', 'w');
fputcsv($out, ['ID','Date/Time','Visitor ID','Session ID','IP Address','Country','State','City','ISP','Browser','Version','OS','Device','User Agent','URL Visited','Referer','Language','Timestamp']);

while ($row = $stmt->fetch()) {
    fputcsv($out, [
        $row['id'], $row['visited_at'], $row['visitor_id'], $row['session_id'],
        $row['ip_address'], $row['country'], $row['state'], $row['city'], $row['isp'],
        $row['browser'], $row['browser_ver'], $row['os'], $row['device'], $row['user_agent'],
        $row['url_visited'], $row['referer'], $row['language'], $row['timestamp'],
    ]);
}
fclose($out);
