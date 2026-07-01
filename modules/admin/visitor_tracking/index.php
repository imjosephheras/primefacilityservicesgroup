<?php
require_once __DIR__ . '/config.php';
vtRequireLogin();

$db = vtGetDB();

/* ── Filters ────────────────────────────────────────────────────────────── */
$fIp      = trim($_GET['ip']      ?? '');
$fCountry = trim($_GET['country'] ?? '');
$fUrl     = trim($_GET['url']     ?? '');
$fBrowser = trim($_GET['browser'] ?? '');
$fDevice  = trim($_GET['device']  ?? '');
$fFrom    = trim($_GET['from']    ?? '');
$fTo      = trim($_GET['to']      ?? '');
$page     = max(1, (int)($_GET['page'] ?? 1));
$perPage  = 25;

/* ── Stats ──────────────────────────────────────────────────────────────── */
$totalViews   = $db->query("SELECT COUNT(*) FROM vt_visits")->fetchColumn();
$visitsToday  = $db->query("SELECT COUNT(*) FROM vt_visits WHERE date(visited_at)=date('now')")->fetchColumn();
$uniqueIPs    = $db->query("SELECT COUNT(DISTINCT ip_address) FROM vt_visits WHERE date(visited_at)=date('now')")->fetchColumn();
$countries    = $db->query("SELECT COUNT(DISTINCT country) FROM vt_visits WHERE country NOT IN ('','Unknown')")->fetchColumn();

/* ── Top Browsers ───────────────────────────────────────────────────────── */
$topBrowsers = $db->query("SELECT browser, COUNT(*) as cnt FROM vt_visits WHERE browser!='' GROUP BY browser ORDER BY cnt DESC LIMIT 5")->fetchAll();
$maxBrowser  = $topBrowsers[0]['cnt'] ?? 1;

/* ── Top Countries ──────────────────────────────────────────────────────── */
$topCountries = $db->query("SELECT country, COUNT(*) as cnt FROM vt_visits WHERE country NOT IN ('','Unknown') GROUP BY country ORDER BY cnt DESC LIMIT 6")->fetchAll();
$maxCountry   = $topCountries[0]['cnt'] ?? 1;

/* ── Most Visited Pages ─────────────────────────────────────────────────── */
$topPages = $db->query("SELECT url_visited, COUNT(*) as cnt FROM vt_visits WHERE url_visited!='' GROUP BY url_visited ORDER BY cnt DESC LIMIT 8")->fetchAll();
$maxPage  = $topPages[0]['cnt'] ?? 1;

/* ── Activity last 24h (hourly) ─────────────────────────────────────────── */
$activity = $db->query("
    SELECT strftime('%H',visited_at) as hr, COUNT(*) as cnt
    FROM vt_visits
    WHERE visited_at >= datetime('now','-24 hours')
    GROUP BY hr ORDER BY hr ASC
")->fetchAll(PDO::FETCH_KEY_PAIR);
$actLabels = [];
$actData   = [];
for ($h = 0; $h < 24; $h++) {
    $actLabels[] = str_pad($h, 2, '0', STR_PAD_LEFT) . ':00';
    $actData[]   = (int)($activity[str_pad($h, 2, '0', STR_PAD_LEFT)] ?? 0);
}

/* ── Visit Log (filtered) ───────────────────────────────────────────────── */
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

$totalFiltered = $db->prepare("SELECT COUNT(*) FROM vt_visits $whereSQL");
$totalFiltered->execute($params);
$totalFiltered = (int)$totalFiltered->fetchColumn();
$totalPages    = max(1, (int)ceil($totalFiltered / $perPage));
$page          = min($page, $totalPages);
$offset        = ($page - 1) * $perPage;

$stmt = $db->prepare("SELECT * FROM vt_visits $whereSQL ORDER BY visited_at DESC LIMIT :lim OFFSET :off");
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':lim', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset,  PDO::PARAM_INT);
$stmt->execute();
$visits = $stmt->fetchAll();

/* ── Browser Color Map ───────────────────────────────────────────────────── */
$browserColors = [
    'Google Chrome'    => '#4285F4',
    'Microsoft Edge'   => '#0078d7',
    'Safari'           => '#FF9F0A',
    'Mozilla Firefox'  => '#FF6611',
    'Opera'            => '#FF1B2D',
    'Unknown'          => '#94a3b8',
];

$currentQuery = http_build_query(array_filter(['ip'=>$fIp,'country'=>$fCountry,'url'=>$fUrl,'browser'=>$fBrowser,'device'=>$fDevice,'from'=>$fFrom,'to'=>$fTo]));
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Visitor Tracking — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
/* ── Reset & Base ─────────────────────────────────────────── */
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5;color:#1e293b;display:flex;min-height:100vh}

/* ── Sidebar ─────────────────────────────────────────────── */
.sidebar{width:220px;min-width:220px;background:#0f1729;color:#c8d3e8;display:flex;flex-direction:column;position:fixed;top:0;left:0;height:100vh;z-index:100;overflow-y:auto}
.sidebar-brand{padding:22px 20px 18px;border-bottom:1px solid rgba(255,255,255,.07)}
.brand-name{font-size:15px;font-weight:700;color:#fff;line-height:1.3}
.brand-sub{font-size:11px;color:#7890b8;margin-top:2px}
.sidebar-section{padding:20px 14px 8px;font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#4a607a}
.nav-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:8px;margin:1px 6px;font-size:13.5px;font-weight:500;color:#8aa0c0;text-decoration:none;cursor:pointer;transition:all .15s}
.nav-item:hover{background:rgba(255,255,255,.06);color:#c8d3e8}
.nav-item.active{background:rgba(26,92,255,.22);color:#fff}
.nav-item svg{width:18px;height:18px;flex-shrink:0;opacity:.8}
.nav-item.active svg{opacity:1}
.sidebar-footer{margin-top:auto;padding:16px;border-top:1px solid rgba(255,255,255,.07)}
.sidebar-user{display:flex;align-items:center;gap:10px}
.user-avatar{width:34px;height:34px;background:linear-gradient(135deg,#1a5cff,#7c3aed);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;flex-shrink:0}
.user-name{font-size:13px;font-weight:600;color:#c8d3e8}
.user-role{font-size:11px;color:#4a607a}
.logout-btn{margin-left:auto;color:#4a607a;text-decoration:none;transition:color .15s}
.logout-btn:hover{color:#ef4444}

/* ── Main ─────────────────────────────────────────────────── */
.main{margin-left:220px;flex:1;min-height:100vh;display:flex;flex-direction:column}
.topbar{background:#fff;border-bottom:1px solid #e2e8f0;padding:14px 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
.topbar-title{display:flex;align-items:center;gap:10px;font-size:19px;font-weight:700;color:#0f1729}
.topbar-title svg{width:22px;height:22px;color:#1a5cff}
.topbar-date{font-size:13px;color:#64748b;font-weight:500}
.content{padding:28px;flex:1}

/* ── Stats Cards ──────────────────────────────────────────── */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:14px;padding:22px 20px;display:flex;align-items:center;gap:16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.stat-icon{width:52px;height:52px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.stat-icon svg{width:26px;height:26px;fill:#fff}
.stat-icon.blue{background:linear-gradient(135deg,#06b6d4,#0891b2)}
.stat-icon.green{background:linear-gradient(135deg,#22c55e,#16a34a)}
.stat-icon.purple{background:linear-gradient(135deg,#a855f7,#7c3aed)}
.stat-icon.orange{background:linear-gradient(135deg,#f97316,#ea580c)}
.stat-value{font-size:28px;font-weight:700;color:#0f1729;line-height:1}
.stat-label{font-size:12px;color:#64748b;margin-top:4px;font-weight:500}

/* ── Panel ────────────────────────────────────────────────── */
.panel{background:#fff;border-radius:14px;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}
.panel-header{padding:18px 22px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
.panel-header svg{width:18px;height:18px;color:#1a5cff}
.panel-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#475569}
.panel-body{padding:20px 22px}

/* ── Charts Row ───────────────────────────────────────────── */
.charts-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-bottom:24px}
.chart-row-2{display:grid;grid-template-columns:2fr 1fr;gap:18px;margin-bottom:24px}

/* ── Bar Chart (CSS) ──────────────────────────────────────── */
.bar-list{display:flex;flex-direction:column;gap:12px}
.bar-item{display:flex;align-items:center;gap:10px;font-size:13px}
.bar-label{width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#374151;flex-shrink:0}
.bar-track{flex:1;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden}
.bar-fill{height:100%;border-radius:4px;transition:width .4s}
.bar-count{width:46px;text-align:right;color:#64748b;font-weight:500;flex-shrink:0;font-size:12px}

/* ── Most Visited Pages ───────────────────────────────────── */
.page-list{display:flex;flex-direction:column;gap:10px}
.page-item{display:flex;align-items:center;gap:10px;font-size:13px}
.page-url{flex:1;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px;font-family:monospace}
.page-track{width:200px;height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden;flex-shrink:0}
.page-fill{height:100%;background:linear-gradient(90deg,#7c3aed,#a855f7);border-radius:4px}
.page-count{width:70px;text-align:right;color:#64748b;font-weight:500;font-size:12px;white-space:nowrap}

/* ── Filters ──────────────────────────────────────────────── */
.filter-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;align-items:end}
.filter-field label{display:block;font-size:12px;font-weight:500;color:#64748b;margin-bottom:5px}
.filter-field input,.filter-field select{width:100%;padding:8px 11px;border:1.5px solid #e2e8f0;border-radius:7px;font-size:13px;font-family:inherit;outline:none;color:#374151;background:#fff;transition:border-color .2s}
.filter-field input:focus,.filter-field select:focus{border-color:#1a5cff}
.filter-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.btn-primary{padding:9px 18px;background:#1a5cff;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit;transition:background .2s}
.btn-primary:hover{background:#1447d4}
.btn-secondary{padding:9px 16px;background:#f1f5f9;color:#64748b;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;gap:6px;transition:all .2s}
.btn-secondary:hover{background:#e2e8f0}
.btn-export{padding:9px 16px;background:#f8fafc;color:#475569;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none;display:flex;align-items:center;gap:6px;transition:all .2s;margin-left:auto}
.btn-export:hover{background:#1a5cff;color:#fff;border-color:#1a5cff}

/* ── Visit Log Table ──────────────────────────────────────── */
.table-wrap{overflow-x:auto}
.log-table{width:100%;border-collapse:collapse;font-size:12.5px}
.log-table th{padding:10px 12px;background:#f8fafc;color:#64748b;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:left;white-space:nowrap;border-bottom:1px solid #e2e8f0}
.log-table td{padding:10px 12px;border-bottom:1px solid #f1f5f9;vertical-align:middle;white-space:nowrap;max-width:200px;overflow:hidden;text-overflow:ellipsis}
.log-table tr:last-child td{border-bottom:none}
.log-table tr:hover td{background:#f8fafc}
.ip-link{color:#1a5cff;text-decoration:none;font-weight:500}
.ip-link:hover{text-decoration:underline}
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:500}
.badge-chrome{background:#dbeafe;color:#1d4ed8}
.badge-edge{background:#ede9fe;color:#5b21b6}
.badge-safari{background:#fef3c7;color:#92400e}
.badge-firefox{background:#ffedd5;color:#9a3412}
.badge-default{background:#f1f5f9;color:#475569}
.badge-dot{width:7px;height:7px;border-radius:50%;background:currentColor;opacity:.7}

/* ── Pagination ───────────────────────────────────────────── */
.pagination{display:flex;align-items:center;gap:6px;margin-top:20px;flex-wrap:wrap}
.pagination a,.pagination span{padding:7px 12px;border-radius:7px;font-size:13px;font-weight:500;text-decoration:none;border:1.5px solid #e2e8f0;color:#475569;background:#fff;transition:all .15s}
.pagination a:hover{background:#1a5cff;color:#fff;border-color:#1a5cff}
.pagination .active{background:#1a5cff;color:#fff;border-color:#1a5cff}
.pagination .dots{border:none;background:none;color:#94a3b8}
.log-meta{display:flex;align-items:center;margin-bottom:14px}
.log-count{font-size:14px;color:#64748b;font-weight:500}
.log-count strong{color:#0f1729}
</style>
</head>
<body>

<!-- ══ Sidebar ══════════════════════════════════════════════════════════ -->
<aside class="sidebar">
  <div class="sidebar-brand">
    <div class="brand-name">Prime Facility</div>
    <div class="brand-sub">Services Group</div>
  </div>

  <div class="sidebar-section">Menu</div>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
    Dashboard
  </a>

  <div class="sidebar-section">Modules</div>
  <a class="nav-item active" href="index.php">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
    Visitor Tracking
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
    Form for Contract
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>
    Employee Work Report
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
    Reports
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>
    Billing / Accounting
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
    Calendar
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
    Profiles &amp; Roles
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    Chat
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
    Send Information
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
    Client Portfolio
  </a>
  <a class="nav-item" href="#">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 9h-2V9h2v2zm0 4h-2v-2h2v2zm1-9V3.5L18.5 8H14z"/></svg>
    Templates
  </a>

  <div class="sidebar-footer">
    <div class="sidebar-user">
      <div class="user-avatar">A</div>
      <div>
        <div class="user-name">Administrator</div>
        <div class="user-role">Admin</div>
      </div>
      <a href="logout.php" class="logout-btn" title="Logout">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
      </a>
    </div>
  </div>
</aside>

<!-- ══ Main Content ══════════════════════════════════════════════════════ -->
<div class="main">
  <div class="topbar">
    <div class="topbar-title">
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
      Visitor Tracking
    </div>
    <div class="topbar-date"><?= date('M d, Y') ?></div>
  </div>

  <div class="content">

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($totalViews) ?></div>
          <div class="stat-label">Total Page Views</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($visitsToday) ?></div>
          <div class="stat-label">Visits Today</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24"><path d="M17 12c0 2.76-2.24 5-5 5s-5-2.24-5-5 2.24-5 5-5 5 2.24 5 5zm-1 0c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zM2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($uniqueIPs) ?></div>
          <div class="stat-label">Unique IPs Today</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($countries) ?></div>
          <div class="stat-label">Countries</div>
        </div>
      </div>
    </div>

    <!-- Activity + Browsers + Countries -->
    <div class="charts-row">
      <!-- Activity Chart -->
      <div class="panel" style="grid-column:span 1">
        <div class="panel-header">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
          <span class="panel-title">Activity (Last 24H)</span>
        </div>
        <div class="panel-body" style="padding:16px 18px">
          <canvas id="activityChart" height="160"></canvas>
        </div>
      </div>

      <!-- Top Browsers -->
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          <span class="panel-title">Top Browsers</span>
        </div>
        <div class="panel-body">
          <div class="bar-list">
            <?php foreach ($topBrowsers as $b):
              $pct = $maxBrowser > 0 ? round($b['cnt'] / $maxBrowser * 100) : 0;
              $color = $browserColors[$b['browser']] ?? '#94a3b8';
            ?>
            <div class="bar-item">
              <div class="bar-label"><?= htmlspecialchars($b['browser']) ?></div>
              <div class="bar-track"><div class="bar-fill" style="width:<?= $pct ?>%;background:<?= $color ?>"></div></div>
              <div class="bar-count"><?= number_format($b['cnt']) ?></div>
            </div>
            <?php endforeach; ?>
            <?php if (empty($topBrowsers)): ?>
            <p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0">No data yet</p>
            <?php endif; ?>
          </div>
        </div>
      </div>

      <!-- Top Countries -->
      <div class="panel">
        <div class="panel-header">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
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
            <?php if (empty($topCountries)): ?>
            <p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0">No data yet</p>
            <?php endif; ?>
          </div>
        </div>
      </div>
    </div>

    <!-- Most Visited Pages -->
    <div class="panel" style="margin-bottom:24px">
      <div class="panel-header">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
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
          <?php if (empty($topPages)): ?>
          <p style="color:#94a3b8;font-size:13px;text-align:center;padding:20px 0">No visits recorded yet.</p>
          <?php endif; ?>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="panel" style="margin-bottom:18px">
      <div class="panel-header">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z"/></svg>
        <span class="panel-title">Filters</span>
      </div>
      <div class="panel-body">
        <form method="GET" action="index.php">
          <div class="filter-grid">
            <div class="filter-field">
              <label>IP Address</label>
              <input type="text" name="ip" value="<?= htmlspecialchars($fIp) ?>" placeholder="e.g. 192.168">
            </div>
            <div class="filter-field">
              <label>Country</label>
              <input type="text" name="country" value="<?= htmlspecialchars($fCountry) ?>" placeholder="United States">
            </div>
            <div class="filter-field">
              <label>URL Contains</label>
              <input type="text" name="url" value="<?= htmlspecialchars($fUrl) ?>" placeholder="/modules/admin">
            </div>
            <div class="filter-field">
              <label>Browser</label>
              <select name="browser">
                <option value="">All Browsers</option>
                <?php foreach (['Google Chrome','Mozilla Firefox','Safari','Microsoft Edge','Opera','Unknown'] as $br): ?>
                <option value="<?= $br ?>" <?= $fBrowser===$br?'selected':'' ?>><?= $br ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="filter-field">
              <label>Device</label>
              <select name="device">
                <option value="">All Devices</option>
                <?php foreach (['Desktop','Mobile','Tablet'] as $dv): ?>
                <option value="<?= $dv ?>" <?= $fDevice===$dv?'selected':'' ?>><?= $dv ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="filter-field">
              <label>From Date</label>
              <input type="date" name="from" value="<?= htmlspecialchars($fFrom) ?>">
            </div>
            <div class="filter-field">
              <label>To Date</label>
              <input type="date" name="to" value="<?= htmlspecialchars($fTo) ?>">
            </div>
          </div>
          <div class="filter-actions">
            <button type="submit" class="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
              Apply Filters
            </button>
            <a href="index.php" class="btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              Clear
            </a>
          </div>
        </form>
      </div>
    </div>

    <!-- Visit Log -->
    <div class="panel">
      <div class="panel-header">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
        <span class="panel-title">Visit Log</span>
        <span style="margin-left:6px;font-size:12px;color:#94a3b8;font-weight:400">(<?= number_format($totalFiltered) ?> records)</span>
        <a href="export.php?<?= htmlspecialchars($currentQuery) ?>" class="btn-export" style="margin-left:auto">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          Export CSV
        </a>
      </div>
      <div class="panel-body" style="padding:0">
        <div class="table-wrap">
          <table class="log-table">
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>ISP</th>
                <th>Browser</th>
                <th>OS</th>
                <th>Device</th>
                <th>URL Visited</th>
                <th>Referer</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              <?php if (empty($visits)): ?>
              <tr><td colspan="10" style="text-align:center;color:#94a3b8;padding:40px">No visits found.</td></tr>
              <?php else: ?>
              <?php foreach ($visits as $v):
                $loc = array_filter([$v['city'], $v['country']]);
                $loc = implode(', ', $loc);
                $bClass = match($v['browser']) {
                  'Google Chrome'   => 'badge-chrome',
                  'Microsoft Edge'  => 'badge-edge',
                  'Safari'          => 'badge-safari',
                  'Mozilla Firefox' => 'badge-firefox',
                  default           => 'badge-default',
                };
              ?>
              <tr>
                <td><?= htmlspecialchars(date('Y-m-d H:i:s', strtotime($v['visited_at']))) ?></td>
                <td><a class="ip-link" href="https://ipinfo.io/<?= urlencode($v['ip_address']) ?>" target="_blank"><?= htmlspecialchars($v['ip_address']) ?></a></td>
                <td title="<?= htmlspecialchars($loc) ?>"><?= htmlspecialchars(mb_strimwidth($loc, 0, 25, '…')) ?></td>
                <td title="<?= htmlspecialchars($v['isp']) ?>"><?= htmlspecialchars(mb_strimwidth($v['isp'], 0, 20, '…')) ?></td>
                <td><span class="badge <?= $bClass ?>"><span class="badge-dot"></span><?= htmlspecialchars($v['browser']) ?></span></td>
                <td><?= htmlspecialchars($v['os']) ?></td>
                <td><?= htmlspecialchars($v['device']) ?></td>
                <td title="<?= htmlspecialchars($v['url_visited']) ?>"><code style="font-size:11px"><?= htmlspecialchars(mb_strimwidth($v['url_visited'], 0, 30, '…')) ?></code></td>
                <td title="<?= htmlspecialchars($v['referer']) ?>" style="color:#94a3b8;font-size:11.5px"><?= htmlspecialchars(mb_strimwidth($v['referer'], 0, 28, '…')) ?></td>
                <td><?php if($v['username']): ?><span class="badge badge-chrome"><?= htmlspecialchars($v['username']) ?></span><?php endif; ?></td>
              </tr>
              <?php endforeach; ?>
              <?php endif; ?>
            </tbody>
          </table>
        </div>

        <?php if ($totalPages > 1): ?>
        <div style="padding:16px 22px;border-top:1px solid #f1f5f9">
          <div class="pagination">
            <?php
            $base = 'index.php?' . ($currentQuery ? $currentQuery . '&' : '');
            if ($page > 1) echo '<a href="'.$base.'page='.($page-1).'">&#8592; Prev</a>';
            $range = range(max(1,$page-2), min($totalPages,$page+2));
            if (!in_array(1,$range)) { echo '<a href="'.$base.'page=1">1</a>'; if ($range[0]>2) echo '<span class="dots">…</span>'; }
            foreach ($range as $p) {
              echo $p==$page ? '<span class="active">'.$p.'</span>' : '<a href="'.$base.'page='.$p.'">'.$p.'</a>';
            }
            if (!in_array($totalPages,$range)) { if (end($range)<$totalPages-1) echo '<span class="dots">…</span>'; echo '<a href="'.$base.'page='.$totalPages.'">'.$totalPages.'</a>'; }
            if ($page < $totalPages) echo '<a href="'.$base.'page='.($page+1).'">Next &#8594;</a>';
            ?>
          </div>
        </div>
        <?php endif; ?>
      </div>
    </div>

  </div><!-- /content -->
</div><!-- /main -->

<script>
const ctx = document.getElementById('activityChart');
if (ctx) {
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: <?= json_encode($actLabels) ?>,
      datasets: [{
        label: 'Page Views',
        data: <?= json_encode($actData) ?>,
        borderColor: '#1a5cff',
        backgroundColor: 'rgba(26,92,255,.10)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 11 }, color: '#94a3b8' } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8', precision: 0 } }
      }
    }
  });
}
</script>
</body>
</html>
