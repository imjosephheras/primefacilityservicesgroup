<?php
require_once __DIR__ . '/../includes/config.php';
vtRequireLogin();
require_once __DIR__ . '/../../core/helpers/messages_store.php';

$db = vtGetDB();

/* ── Unread message count (for sidebar badge) ─────────────────────────── */
$unreadMsgCount = (int)getMessagesDB()->query("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0")->fetchColumn();

/* ── Filters ─────────────────────────────────────────────────────────── */
$fIp      = trim($_GET['ip']      ?? '');
$fCountry = trim($_GET['country'] ?? '');
$fUrl     = trim($_GET['url']     ?? '');
$fBrowser = trim($_GET['browser'] ?? '');
$fDevice  = trim($_GET['device']  ?? '');
$fFrom    = trim($_GET['from']    ?? '');
$fTo      = trim($_GET['to']      ?? '');
$page     = max(1, (int)($_GET['page'] ?? 1));
$perPage  = 25;

/* ── Summary Stats ───────────────────────────────────────────────────── */
$totalViews     = (int)$db->query("SELECT COUNT(*) FROM vt_visits")->fetchColumn();
$uniqueVisitors = (int)$db->query("SELECT COUNT(DISTINCT visitor_id) FROM vt_visits")->fetchColumn();
$uniqueSessions = (int)$db->query("SELECT COUNT(DISTINCT session_id) FROM vt_visits")->fetchColumn();

$recurringVisitors = (int)$db->query("
    SELECT COUNT(*) FROM (
        SELECT visitor_id FROM vt_visits GROUP BY visitor_id HAVING COUNT(DISTINCT session_id) > 1
    )
")->fetchColumn();

$totalCountries = (int)$db->query("SELECT COUNT(DISTINCT country) FROM vt_visits WHERE country NOT IN ('','Unknown')")->fetchColumn();

/* ── Top Countries ───────────────────────────────────────────────────── */
$topCountries = $db->query("
    SELECT country, COUNT(*) AS cnt FROM vt_visits
    WHERE country NOT IN ('','Unknown','Local Network')
    GROUP BY country ORDER BY cnt DESC LIMIT 8
")->fetchAll();
$maxCountry = $topCountries[0]['cnt'] ?? 1;

/* ── Top Cities ──────────────────────────────────────────────────────── */
$topCities = $db->query("
    SELECT city, country, COUNT(*) AS cnt FROM vt_visits
    WHERE city NOT IN ('','Local')
    GROUP BY city ORDER BY cnt DESC LIMIT 8
")->fetchAll();
$maxCity = $topCities[0]['cnt'] ?? 1;

/* ── Top Browsers ────────────────────────────────────────────────────── */
$topBrowsers = $db->query("
    SELECT browser, COUNT(*) AS cnt FROM vt_visits
    WHERE browser != '' GROUP BY browser ORDER BY cnt DESC LIMIT 6
")->fetchAll();
$maxBrowser = $topBrowsers[0]['cnt'] ?? 1;

/* ── OS Distribution ─────────────────────────────────────────────────── */
$topOS = $db->query("
    SELECT os, COUNT(*) AS cnt FROM vt_visits
    WHERE os != '' GROUP BY os ORDER BY cnt DESC LIMIT 6
")->fetchAll();
$maxOS = $topOS[0]['cnt'] ?? 1;

/* ── Device Distribution ─────────────────────────────────────────────── */
$deviceDist = $db->query("
    SELECT device, COUNT(*) AS cnt FROM vt_visits
    GROUP BY device ORDER BY cnt DESC
")->fetchAll();
$totalDevices = array_sum(array_column($deviceDist, 'cnt')) ?: 1;

/* ── Most Visited Pages ──────────────────────────────────────────────── */
$topPages = $db->query("
    SELECT url_visited, COUNT(*) AS cnt FROM vt_visits
    WHERE url_visited != '' GROUP BY url_visited ORDER BY cnt DESC LIMIT 10
")->fetchAll();
$maxPage = $topPages[0]['cnt'] ?? 1;

/* ── Top Referers ────────────────────────────────────────────────────── */
$topReferers = $db->query("
    SELECT referer, COUNT(*) AS cnt FROM vt_visits
    WHERE referer != '' GROUP BY referer ORDER BY cnt DESC LIMIT 8
")->fetchAll();
$maxReferer = $topReferers[0]['cnt'] ?? 1;

/* ── Activity last 24h (hourly) ──────────────────────────────────────── */
$actRows = $db->query("
    SELECT strftime('%H', visited_at) AS hr, COUNT(*) AS cnt
    FROM vt_visits WHERE visited_at >= datetime('now','-24 hours')
    GROUP BY hr ORDER BY hr
")->fetchAll(PDO::FETCH_KEY_PAIR);
$actLabels = [];
$actData   = [];
for ($h = 0; $h < 24; $h++) {
    $actLabels[] = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
    $actData[]   = (int)($actRows[str_pad($h, 2, '0', STR_PAD_LEFT)] ?? 0);
}

/* ── Visit Log (filtered) ────────────────────────────────────────────── */
$where  = [];
$params = [];
if ($fIp)      { $where[] = "ip_address LIKE :ip";      $params[':ip']      = "%$fIp%"; }
if ($fCountry) { $where[] = "country LIKE :country";     $params[':country'] = "%$fCountry%"; }
if ($fUrl)     { $where[] = "url_visited LIKE :url";     $params[':url']     = "%$fUrl%"; }
if ($fBrowser) { $where[] = "browser = :browser";        $params[':browser'] = $fBrowser; }
if ($fDevice)  { $where[] = "device = :device";          $params[':device']  = $fDevice; }
if ($fFrom)    { $where[] = "date(visited_at) >= :from"; $params[':from']    = $fFrom; }
if ($fTo)      { $where[] = "date(visited_at) <= :to";   $params[':to']      = $fTo; }
$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$cntStmt = $db->prepare("SELECT COUNT(*) FROM vt_visits $whereSQL");
$cntStmt->execute($params);
$totalFiltered = (int)$cntStmt->fetchColumn();
$totalPages    = max(1, (int)ceil($totalFiltered / $perPage));
$page          = min($page, $totalPages);
$offset        = ($page - 1) * $perPage;

$visStmt = $db->prepare("SELECT * FROM vt_visits $whereSQL ORDER BY visited_at DESC LIMIT :lim OFFSET :off");
foreach ($params as $k => $v) $visStmt->bindValue($k, $v);
$visStmt->bindValue(':lim', $perPage, PDO::PARAM_INT);
$visStmt->bindValue(':off', $offset,  PDO::PARAM_INT);
$visStmt->execute();
$visits = $visStmt->fetchAll();

$currentQuery = http_build_query(array_filter(compact('fIp','fCountry','fUrl','fBrowser','fDevice','fFrom','fTo'), fn($v) => $v !== ''));

/* ── Login History (last 10) ─────────────────────────────────────────── */
$loginHistory = $db->query("SELECT * FROM vt_login_history ORDER BY logged_at DESC LIMIT 10")->fetchAll();

/* ── Browser Colors ──────────────────────────────────────────────────── */
$browserColors = [
    'Google Chrome'    => '#4285F4',
    'Microsoft Edge'   => '#0078d7',
    'Safari'           => '#FF9F0A',
    'Mozilla Firefox'  => '#FF6611',
    'Opera'            => '#FF1B2D',
    'Unknown'          => '#94a3b8',
];
$deviceColors = ['Desktop' => '#1a5cff', 'Mobile' => '#22c55e', 'Tablet' => '#f97316'];
$osColors = ['Windows' => '#0078d4', 'macOS' => '#555', 'Android' => '#3ddc84', 'iOS' => '#555', 'Linux' => '#f97316', 'Chrome OS' => '#4285f4', 'Unknown' => '#94a3b8'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visitor Tracking — Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5;color:#1e293b;display:flex;min-height:100vh;font-size:14px}

/* Sidebar */
.sidebar{width:224px;min-width:224px;background:#0f1729;color:#c8d3e8;display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100;overflow-y:auto}
.sidebar-brand{padding:22px 20px 18px;border-bottom:1px solid rgba(255,255,255,.07)}
.brand-name{font-size:14.5px;font-weight:700;color:#fff;line-height:1.3}
.brand-sub{font-size:11px;color:#7890b8;margin-top:2px}
.sidebar-section{padding:18px 14px 6px;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#4a607a}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:8px;margin:1px 6px;font-size:13px;font-weight:500;color:#8aa0c0;text-decoration:none;cursor:pointer;transition:all .15s;border:none;background:none;width:calc(100% - 12px);text-align:left}
.nav-item:hover{background:rgba(255,255,255,.06);color:#c8d3e8}
.nav-item.active{background:rgba(26,92,255,.22);color:#fff}
.nav-item svg{width:17px;height:17px;flex-shrink:0;opacity:.8;fill:currentColor}
.nav-item.active svg{opacity:1}
.nav-badge{margin-left:auto;background:#ef4444;color:#fff;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:20px}
.sidebar-footer{margin-top:auto;padding:16px;border-top:1px solid rgba(255,255,255,.07)}
.user-row{display:flex;align-items:center;gap:10px}
.user-avatar{width:34px;height:34px;background:linear-gradient(135deg,#1a5cff,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
.user-name{font-size:13px;font-weight:600;color:#c8d3e8}
.user-role{font-size:11px;color:#4a607a}
.logout-btn{margin-left:auto;color:#4a607a;text-decoration:none;transition:color .15s;display:flex}
.logout-btn:hover{color:#ef4444}
.logout-btn svg{width:18px;height:18px;fill:currentColor}

/* Main */
.main{margin-left:224px;flex:1;min-height:100vh;display:flex;flex-direction:column}
.topbar{background:#fff;border-bottom:1px solid #e2e8f0;padding:13px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.topbar-title{display:flex;align-items:center;gap:9px;font-size:18px;font-weight:700;color:#0f1729}
.topbar-title svg{width:21px;height:21px;fill:#1a5cff}
.topbar-date{font-size:12.5px;color:#64748b;font-weight:500}
.content{padding:24px 28px;flex:1}

/* Stat cards */
.stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:22px}
.stat-card{background:#fff;border-radius:12px;padding:18px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9}
.stat-icon{width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.stat-icon svg{width:24px;height:24px;fill:#fff}
.stat-icon.blue{background:linear-gradient(135deg,#06b6d4,#0891b2)}
.stat-icon.green{background:linear-gradient(135deg,#22c55e,#16a34a)}
.stat-icon.purple{background:linear-gradient(135deg,#a855f7,#7c3aed)}
.stat-icon.orange{background:linear-gradient(135deg,#f97316,#ea580c)}
.stat-icon.rose{background:linear-gradient(135deg,#f43f5e,#e11d48)}
.stat-value{font-size:26px;font-weight:700;color:#0f1729;line-height:1}
.stat-label{font-size:11.5px;color:#64748b;margin-top:3px;font-weight:500}

/* Panels */
.panel{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9;overflow:hidden}
.panel-header{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
.panel-header svg{width:16px;height:16px;fill:#1a5cff;flex-shrink:0}
.panel-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#475569}
.panel-body{padding:18px 20px}

/* Grid layouts */
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
.grid-2-1{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:20px}
.mb20{margin-bottom:20px}

/* Bar chart CSS */
.bar-list{display:flex;flex-direction:column;gap:10px}
.bar-item{display:flex;align-items:center;gap:9px;font-size:12.5px}
.bar-label{width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#374151;flex-shrink:0;font-size:12px}
.bar-track{flex:1;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden}
.bar-fill{height:100%;border-radius:4px}
.bar-count{width:44px;text-align:right;color:#64748b;font-weight:500;flex-shrink:0;font-size:11.5px}

/* Device donuts */
.device-list{display:flex;flex-direction:column;gap:12px}
.device-item{display:flex;align-items:center;gap:10px;font-size:12.5px}
.device-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.device-label{flex:1;color:#374151}
.device-pct{font-weight:600;color:#0f1729;min-width:36px;text-align:right}

/* Pages list */
.page-list{display:flex;flex-direction:column;gap:9px}
.page-item{display:flex;align-items:center;gap:9px;font-size:12px}
.page-url{flex:1;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:monospace;font-size:11.5px}
.page-track{width:100px;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;flex-shrink:0}
.page-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:4px}
.page-count{width:56px;text-align:right;color:#64748b;font-weight:500;font-size:11.5px;white-space:nowrap}

/* Filters */
.filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;align-items:end}
.filter-field label{display:block;font-size:11.5px;font-weight:500;color:#64748b;margin-bottom:4px}
.filter-field input,.filter-field select{width:100%;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:6px;font-size:12.5px;font-family:inherit;outline:none;color:#374151;background:#fff;transition:border-color .2s}
.filter-field input:focus,.filter-field select:focus{border-color:#1a5cff}
.filter-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.btn-primary{padding:8px 16px;background:#1a5cff;color:#fff;border:none;border-radius:7px;font-size:12.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:5px;font-family:inherit;transition:background .2s}
.btn-primary:hover{background:#1447d4}
.btn-secondary{padding:8px 14px;background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12.5px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s}
.btn-secondary:hover{background:#e2e8f0}
.btn-export{padding:8px 14px;background:#f8fafc;color:#475569;border:1.5px solid #e2e8f0;border-radius:7px;font-size:12.5px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;gap:5px;transition:all .2s;margin-left:auto}
.btn-export:hover{background:#1a5cff;color:#fff;border-color:#1a5cff}
.btn-export svg{fill:currentColor}

/* Visit Log */
.table-wrap{overflow-x:auto}
.log-table{width:100%;border-collapse:collapse;font-size:12px}
.log-table th{padding:9px 11px;background:#f8fafc;color:#64748b;font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;text-align:left;white-space:nowrap;border-bottom:1px solid #e2e8f0}
.log-table td{padding:9px 11px;border-bottom:1px solid #f1f5f9;vertical-align:middle;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis}
.log-table tr:last-child td{border-bottom:none}
.log-table tr:hover td{background:#f8fafc}
.ip-link{color:#1a5cff;text-decoration:none;font-weight:500}
.ip-link:hover{text-decoration:underline}
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:500}
.badge-chrome{background:#dbeafe;color:#1d4ed8}
.badge-edge{background:#ede9fe;color:#5b21b6}
.badge-safari{background:#fef3c7;color:#92400e}
.badge-firefox{background:#ffedd5;color:#9a3412}
.badge-default{background:#f1f5f9;color:#475569}
.badge-success{background:#dcfce7;color:#15803d}
.badge-fail{background:#fee2e2;color:#dc2626}
.badge-dot{width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.7}

/* Pagination */
.pagination{display:flex;align-items:center;gap:5px;margin-top:18px;flex-wrap:wrap}
.pagination a,.pagination span{padding:6px 11px;border-radius:6px;font-size:12.5px;font-weight:500;text-decoration:none;border:1.5px solid #e2e8f0;color:#475569;background:#fff;transition:all .15s}
.pagination a:hover{background:#1a5cff;color:#fff;border-color:#1a5cff}
.pagination .active{background:#1a5cff;color:#fff;border-color:#1a5cff}
.pagination .dots{border:none;background:none;color:#94a3b8}

/* Login history */
.lh-table{width:100%;border-collapse:collapse;font-size:12px}
.lh-table th{padding:8px 10px;background:#f8fafc;color:#64748b;font-weight:600;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;text-align:left;white-space:nowrap;border-bottom:1px solid #e2e8f0}
.lh-table td{padding:8px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle;white-space:nowrap}
.lh-table tr:last-child td{border-bottom:none}
.lh-table tr:hover td{background:#f8fafc}

/* Section title */
.section-title{font-size:13.5px;font-weight:700;color:#0f1729;margin-bottom:14px}

/* Canvas sizing */
canvas{max-width:100%;height:auto!important}
</style>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar">
  <div class="sidebar-brand">
    <div class="brand-name">Prime Facility</div>
    <div class="brand-sub">Services Group — Admin</div>
  </div>

  <div class="sidebar-section">Analytics</div>
  <a class="nav-item active" href="index.php">
    <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
    Visitor Tracking
  </a>
  <a class="nav-item" href="../messages/index.php">
    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
    Messages &amp; Quotes
    <?php if (($unreadMsgCount ?? 0) > 0): ?><span class="nav-badge"><?= $unreadMsgCount ?></span><?php endif; ?>
  </a>

  <div class="sidebar-section">System</div>
  <a class="nav-item" href="#login-history">
    <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4.9l5 2.22V11c0 3.47-2.34 6.73-5 7.93-2.66-1.2-5-4.46-5-7.93V8.12L12 5.9z"/></svg>
    Login History
  </a>

  <div class="sidebar-footer">
    <div class="user-row">
      <div class="user-avatar"><?= strtoupper(substr($_SESSION['vt_user'] ?? 'A', 0, 1)) ?></div>
      <div>
        <div class="user-name"><?= htmlspecialchars($_SESSION['vt_user'] ?? 'Admin') ?></div>
        <div class="user-role">Administrator</div>
      </div>
      <a href="../login/logout.php" class="logout-btn" title="Sign Out">
        <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
      </a>
    </div>
  </div>
</aside>

<!-- Main -->
<div class="main">
  <div class="topbar">
    <div class="topbar-title">
      <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
      Visitor Tracking Dashboard
    </div>
    <div class="topbar-date"><?= date('F j, Y') ?></div>
  </div>

  <div class="content">

    <!-- ── Stats Cards ── -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($totalViews) ?></div>
          <div class="stat-label">Total Visits</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($uniqueVisitors) ?></div>
          <div class="stat-label">Unique Visitors</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($recurringVisitors) ?></div>
          <div class="stat-label">Recurring Visitors</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($totalCountries) ?></div>
          <div class="stat-label">Countries</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rose">
          <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($uniqueSessions) ?></div>
          <div class="stat-label">Total Sessions</div>
        </div>
      </div>
    </div>

    <!-- ── Activity Chart + Devices ── -->
    <div class="grid-2-1">
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
          <span class="panel-title">Activity — Last 24 Hours</span>
        </div>
        <div class="panel-body" style="padding:14px 16px">
          <canvas id="activityChart" height="140"></canvas>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14z"/></svg>
          <span class="panel-title">Devices</span>
        </div>
        <div class="panel-body">
          <div style="position:relative;height:130px;margin-bottom:16px">
            <canvas id="deviceChart"></canvas>
          </div>
          <div class="device-list">
            <?php foreach ($deviceDist as $d):
              $pct = round($d['cnt'] / $totalDevices * 100);
              $color = $deviceColors[$d['device']] ?? '#94a3b8';
            ?>
            <div class="device-item">
              <div class="device-dot" style="background:<?= $color ?>"></div>
              <div class="device-label"><?= htmlspecialchars($d['device']) ?></div>
              <div class="device-pct"><?= $pct ?>%</div>
            </div>
            <?php endforeach; ?>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Countries + Cities ── -->
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span class="panel-title">Top Countries</span>
        </div>
        <div class="panel-body">
          <div class="bar-list">
            <?php foreach ($topCountries as $c):
              $pct = $maxCountry > 0 ? round($c['cnt'] / $maxCountry * 100) : 0;
            ?>
            <div class="bar-item">
              <div class="bar-label"><?= htmlspecialchars($c['country']) ?></div>
              <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%;background:#22c55e"></div></div>
              <div class="bar-count"><?= number_format($c['cnt']) ?></div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topCountries)): ?><p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:16px 0">No data yet</p><?php endif; ?>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          <span class="panel-title">Top Cities</span>
        </div>
        <div class="panel-body">
          <div class="bar-list">
            <?php foreach ($topCities as $c):
              $pct = $maxCity > 0 ? round($c['cnt'] / $maxCity * 100) : 0;
            ?>
            <div class="bar-item">
              <div class="bar-label" title="<?= htmlspecialchars($c['country']) ?>"><?= htmlspecialchars($c['city']) ?></div>
              <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%;background:#0ea5e9"></div></div>
              <div class="bar-count"><?= number_format($c['cnt']) ?></div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topCities)): ?><p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:16px 0">No data yet</p><?php endif; ?>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Browsers + OS ── -->
    <div class="grid-2">
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          <span class="panel-title">Browsers</span>
        </div>
        <div class="panel-body">
          <div class="bar-list">
            <?php foreach ($topBrowsers as $b):
              $pct   = $maxBrowser > 0 ? round($b['cnt'] / $maxBrowser * 100) : 0;
              $color = $browserColors[$b['browser']] ?? '#94a3b8';
            ?>
            <div class="bar-item">
              <div class="bar-label"><?= htmlspecialchars($b['browser']) ?></div>
              <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%;background:<?= $color ?>"></div></div>
              <div class="bar-count"><?= number_format($b['cnt']) ?></div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topBrowsers)): ?><p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:16px 0">No data yet</p><?php endif; ?>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/></svg>
          <span class="panel-title">Operating Systems</span>
        </div>
        <div class="panel-body">
          <div class="bar-list">
            <?php foreach ($topOS as $o):
              $pct   = $maxOS > 0 ? round($o['cnt'] / $maxOS * 100) : 0;
              $color = $osColors[$o['os']] ?? '#94a3b8';
            ?>
            <div class="bar-item">
              <div class="bar-label"><?= htmlspecialchars($o['os']) ?></div>
              <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%;background:<?= $color ?>"></div></div>
              <div class="bar-count"><?= number_format($o['cnt']) ?></div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topOS)): ?><p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:16px 0">No data yet</p><?php endif; ?>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Top Pages + Referers ── -->
    <div class="grid-2 mb20">
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
          <span class="panel-title">Most Visited Pages</span>
        </div>
        <div class="panel-body">
          <div class="page-list">
            <?php foreach ($topPages as $p):
              $pct = $maxPage > 0 ? round($p['cnt'] / $maxPage * 100) : 0;
            ?>
            <div class="page-item">
              <div class="page-url" title="<?= htmlspecialchars($p['url_visited']) ?>"><?= htmlspecialchars($p['url_visited']) ?></div>
              <div class="page-track"><div class="page-fill" style="width:<?= $pct ?>%"></div></div>
              <div class="page-count"><?= number_format($p['cnt']) ?> hits</div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topPages)): ?><p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:16px 0">No visits recorded yet.</p><?php endif; ?>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
          <span class="panel-title">Top Referers</span>
        </div>
        <div class="panel-body">
          <div class="bar-list">
            <?php foreach ($topReferers as $r):
              $pct   = $maxReferer > 0 ? round($r['cnt'] / $maxReferer * 100) : 0;
              $label = parse_url($r['referer'], PHP_URL_HOST) ?: $r['referer'];
            ?>
            <div class="bar-item">
              <div class="bar-label" title="<?= htmlspecialchars($r['referer']) ?>"><?= htmlspecialchars($label) ?></div>
              <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%;background:#f59e0b"></div></div>
              <div class="bar-count"><?= number_format($r['cnt']) ?></div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topReferers)): ?><p style="color:#94a3b8;font-size:12.5px;text-align:center;padding:16px 0">No referers yet</p><?php endif; ?>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Filters ── -->
    <div class="panel mb20">
      <div class="panel-header">
        <svg viewBox="0 0 24 24"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/></svg>
        <span class="panel-title">Filters</span>
      </div>
      <div class="panel-body">
        <form method="GET" action="index.php">
          <div class="filter-grid">
            <div class="filter-field"><label>IP Address</label><input type="text" name="fIp" value="<?= htmlspecialchars($fIp) ?>" placeholder="192.168…"></div>
            <div class="filter-field"><label>Country</label><input type="text" name="fCountry" value="<?= htmlspecialchars($fCountry) ?>" placeholder="United States"></div>
            <div class="filter-field"><label>URL Contains</label><input type="text" name="fUrl" value="<?= htmlspecialchars($fUrl) ?>" placeholder="/about"></div>
            <div class="filter-field">
              <label>Browser</label>
              <select name="fBrowser">
                <option value="">All</option>
                <?php foreach (['Google Chrome','Mozilla Firefox','Safari','Microsoft Edge','Opera','Unknown'] as $br): ?>
                <option value="<?= $br ?>" <?= $fBrowser===$br?'selected':'' ?>><?= $br ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="filter-field">
              <label>Device</label>
              <select name="fDevice">
                <option value="">All</option>
                <?php foreach (['Desktop','Mobile','Tablet'] as $dv): ?>
                <option value="<?= $dv ?>" <?= $fDevice===$dv?'selected':'' ?>><?= $dv ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="filter-field"><label>From Date</label><input type="date" name="fFrom" value="<?= htmlspecialchars($fFrom) ?>"></div>
            <div class="filter-field"><label>To Date</label><input type="date" name="fTo" value="<?= htmlspecialchars($fTo) ?>"></div>
          </div>
          <div class="filter-actions">
            <button type="submit" class="btn-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              Apply Filters
            </button>
            <a href="index.php" class="btn-secondary">Clear</a>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Visit Log ── -->
    <div class="panel mb20">
      <div class="panel-header">
        <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
        <span class="panel-title">Visit Log</span>
        <span style="margin-left:6px;font-size:11px;color:#94a3b8">(<?= number_format($totalFiltered) ?> records)</span>
        <a href="../visitors/export.php?<?= htmlspecialchars($currentQuery) ?>" class="btn-export">
          <svg width="13" height="13" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Export CSV
        </a>
      </div>
      <div class="panel-body" style="padding:0">
        <div class="table-wrap">
          <table class="log-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Visitor ID</th>
                <th>IP Address</th>
                <th>Country</th>
                <th>State</th>
                <th>City</th>
                <th>ISP</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Device</th>
                <th>URL Visited</th>
                <th>Referer</th>
                <th>Language</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($visits)): ?>
              <tr><td colspan="13" style="text-align:center;color:#94a3b8;padding:36px">No visits found.</td></tr>
              <?php else: ?>
              <?php foreach ($visits as $v):
                $bClass = match($v['browser']) {
                    'Google Chrome'   => 'badge-chrome',
                    'Microsoft Edge'  => 'badge-edge',
                    'Safari'          => 'badge-safari',
                    'Mozilla Firefox' => 'badge-firefox',
                    default           => 'badge-default',
                };
                $shortVid = $v['visitor_id'] ? substr($v['visitor_id'], 0, 8) . '…' : '—';
              ?>
              <tr>
                <td><?= htmlspecialchars($v['visited_at']) ?></td>
                <td title="<?= htmlspecialchars($v['visitor_id']) ?>" style="font-family:monospace;font-size:11px"><?= htmlspecialchars($shortVid) ?></td>
                <td><a class="ip-link" href="https://ipinfo.io/<?= urlencode($v['ip_address']) ?>" target="_blank" rel="noopener"><?= htmlspecialchars($v['ip_address']) ?></a></td>
                <td><?= htmlspecialchars($v['country']) ?></td>
                <td><?= htmlspecialchars($v['state']) ?></td>
                <td><?= htmlspecialchars($v['city']) ?></td>
                <td title="<?= htmlspecialchars($v['isp']) ?>"><?= htmlspecialchars(mb_strimwidth($v['isp'], 0, 18, '…')) ?></td>
                <td><span class="badge <?= $bClass ?>"><span class="badge-dot"></span><?= htmlspecialchars($v['browser']) ?></span></td>
                <td><?= htmlspecialchars($v['os']) ?></td>
                <td><?= htmlspecialchars($v['device']) ?></td>
                <td title="<?= htmlspecialchars($v['url_visited']) ?>"><code style="font-size:11px"><?= htmlspecialchars(mb_strimwidth($v['url_visited'], 0, 28, '…')) ?></code></td>
                <td title="<?= htmlspecialchars($v['referer']) ?>" style="color:#94a3b8;font-size:11px"><?= htmlspecialchars(mb_strimwidth($v['referer'], 0, 24, '…')) ?></td>
                <td style="font-size:11px"><?= htmlspecialchars(substr($v['language'], 0, 10)) ?></td>
              </tr>
              <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>

        <?php if ($totalPages > 1): ?>
        <div style="padding:14px 20px;border-top:1px solid #f1f5f9">
          <div class="pagination">
            <?php
            $base = 'index.php?' . ($currentQuery ? $currentQuery . '&' : '');
            if ($page > 1)           echo '<a href="'.$base.'page='.($page-1).'">← Prev</a>';
            $range = range(max(1,$page-2), min($totalPages,$page+2));
            if (!in_array(1,$range)) { echo '<a href="'.$base.'page=1">1</a>'; if ($range[0]>2) echo '<span class="dots">…</span>'; }
            foreach ($range as $p)   echo $p==$page ? '<span class="active">'.$p.'</span>' : '<a href="'.$base.'page='.$p.'">'.$p.'</a>';
            if (!in_array($totalPages,$range)) { if (end($range)<$totalPages-1) echo '<span class="dots">…</span>'; echo '<a href="'.$base.'page='.$totalPages.'">'.$totalPages.'</a>'; }
            if ($page < $totalPages) echo '<a href="'.$base.'page='.($page+1).'">Next →</a>';
            ?>
          </div>
        </div>
        <?php endif; ?>
      </div>
    </div>

    <!-- ── Login History ── -->
    <div class="panel" id="login-history">
      <div class="panel-header">
        <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
        <span class="panel-title">Login History</span>
        <span style="margin-left:6px;font-size:11px;color:#94a3b8">(last 10 entries)</span>
      </div>
      <div class="panel-body" style="padding:0">
        <div class="table-wrap">
          <table class="lh-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>User</th>
                <th>Status</th>
                <th>IP</th>
                <th>Country</th>
                <th>State</th>
                <th>City</th>
                <th>ISP</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Device</th>
                <th>Location</th>
                <th>Geo Permission</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($loginHistory)): ?>
              <tr><td colspan="13" style="text-align:center;color:#94a3b8;padding:30px">No login records yet.</td></tr>
              <?php else: ?>
              <?php foreach ($loginHistory as $lh): ?>
              <tr>
                <td><?= htmlspecialchars($lh['logged_at']) ?></td>
                <td><?= htmlspecialchars($lh['username']) ?></td>
                <td>
                  <span class="badge <?= $lh['login_status'] === 'Success' ? 'badge-success' : 'badge-fail' ?>">
                    <span class="badge-dot"></span><?= htmlspecialchars($lh['login_status']) ?>
                  </span>
                </td>
                <td><?= htmlspecialchars($lh['ip_address']) ?></td>
                <td><?= htmlspecialchars($lh['country']) ?></td>
                <td><?= htmlspecialchars($lh['state']) ?></td>
                <td><?= htmlspecialchars($lh['city']) ?></td>
                <td title="<?= htmlspecialchars($lh['isp']) ?>"><?= htmlspecialchars(mb_strimwidth($lh['isp'], 0, 18, '…')) ?></td>
                <td><?= htmlspecialchars($lh['browser']) ?></td>
                <td><?= htmlspecialchars($lh['os']) ?></td>
                <td><?= htmlspecialchars($lh['device']) ?></td>
                <td style="font-size:11px;font-family:monospace">
                  <?php if ($lh['latitude'] !== null): ?>
                    <?= round($lh['latitude'], 5) ?>, <?= round($lh['longitude'], 5) ?>
                    <br><span style="color:#94a3b8">±<?= round($lh['accuracy']) ?>m</span>
                  <?php else: ?>
                    <span style="color:#94a3b8">—</span>
                  <?php endif; ?>
                </td>
                <td><?= htmlspecialchars($lh['geo_status'] ?? '—') ?></td>
              </tr>
              <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </div><!-- /content -->
</div><!-- /main -->

<script>
/* ── Activity Chart ── */
(function() {
  const ctx = document.getElementById('activityChart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: <?= json_encode($actLabels) ?>,
      datasets: [{
        label: 'Visits',
        data: <?= json_encode($actData) ?>,
        borderColor: '#1a5cff',
        backgroundColor: 'rgba(26,92,255,.09)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 }, color: '#94a3b8' } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8', precision: 0 } }
      }
    }
  });
})();

/* ── Device Doughnut ── */
(function() {
  const ctx = document.getElementById('deviceChart');
  if (!ctx) return;
  <?php
    $dLabels = array_column($deviceDist, 'device');
    $dData   = array_column($deviceDist, 'cnt');
    $dColors = array_map(fn($d) => $deviceColors[$d] ?? '#94a3b8', $dLabels);
  ?>
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: <?= json_encode($dLabels) ?>,
      datasets: [{ data: <?= json_encode($dData) ?>, backgroundColor: <?= json_encode($dColors) ?>, borderWidth: 2, borderColor: '#fff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } }
      }
    }
  });
})();
</script>
</body>
</html>
