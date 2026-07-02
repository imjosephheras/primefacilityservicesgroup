<?php
require_once __DIR__ . '/../includes/config.php';
vtRequireLogin();
require_once __DIR__ . '/../../core/helpers/messages_store.php';

$db = getMessagesDB();

/* ── Row actions (mark read/unread, delete) ───────────────────────────── */
if (isset($_GET['action'], $_GET['id'])) {
    $id = (int)$_GET['id'];
    if ($_GET['action'] === 'read') {
        $db->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?')->execute([$id]);
    } elseif ($_GET['action'] === 'unread') {
        $db->prepare('UPDATE contact_messages SET is_read = 0 WHERE id = ?')->execute([$id]);
    } elseif ($_GET['action'] === 'delete') {
        $db->prepare('DELETE FROM contact_messages WHERE id = ?')->execute([$id]);
    }
    $back = 'index.php';
    if (!empty($_GET['qs'])) $back .= '?' . $_GET['qs'];
    header('Location: ' . $back);
    exit;
}

/* ── Filters ───────────────────────────────────────────────────────────── */
$fName    = trim($_GET['name']    ?? '');
$fEmail   = trim($_GET['email']   ?? '');
$fService = trim($_GET['service'] ?? '');
$fStatus  = trim($_GET['status']  ?? '');
$page     = max(1, (int)($_GET['page'] ?? 1));
$perPage  = 20;

/* ── Summary Stats ─────────────────────────────────────────────────────── */
$totalMessages = (int)$db->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();
$unreadCount   = (int)$db->query("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0")->fetchColumn();
$quoteCount    = (int)$db->query("SELECT COUNT(*) FROM contact_messages WHERE service_type IS NOT NULL AND service_type != ''")->fetchColumn();
$weekCount     = (int)$db->query("SELECT COUNT(*) FROM contact_messages WHERE submitted_at >= datetime('now','-7 days')")->fetchColumn();

/* ── Message list (filtered) ──────────────────────────────────────────── */
$where  = [];
$params = [];
if ($fName)    { $where[] = "full_name LIKE :name";       $params[':name']    = "%$fName%"; }
if ($fEmail)   { $where[] = "email LIKE :email";          $params[':email']   = "%$fEmail%"; }
if ($fService) { $where[] = "service_type LIKE :service"; $params[':service'] = "%$fService%"; }
if ($fStatus === 'unread') { $where[] = "is_read = 0"; }
if ($fStatus === 'read')   { $where[] = "is_read = 1"; }
$whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$cntStmt = $db->prepare("SELECT COUNT(*) FROM contact_messages $whereSQL");
$cntStmt->execute($params);
$totalFiltered = (int)$cntStmt->fetchColumn();
$totalPages    = max(1, (int)ceil($totalFiltered / $perPage));
$page          = min($page, $totalPages);
$offset        = ($page - 1) * $perPage;

$stmt = $db->prepare("SELECT * FROM contact_messages $whereSQL ORDER BY submitted_at DESC LIMIT :lim OFFSET :off");
foreach ($params as $k => $v) $stmt->bindValue($k, $v);
$stmt->bindValue(':lim', $perPage, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset,  PDO::PARAM_INT);
$stmt->execute();
$messages = $stmt->fetchAll();

$currentQuery = http_build_query(array_filter(compact('fName','fEmail','fService','fStatus'), fn($v) => $v !== ''));
$base = 'index.php?' . $currentQuery . ($currentQuery ? '&' : '');
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Messages &amp; Quote Requests — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#f0f2f5;color:#1e293b;display:flex;min-height:100vh;font-size:14px}

/* Sidebar (shared with dashboard) */
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
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px}
.stat-card{background:#fff;border-radius:12px;padding:18px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9}
.stat-icon{width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.stat-icon svg{width:24px;height:24px;fill:#fff}
.stat-icon.blue{background:linear-gradient(135deg,#06b6d4,#0891b2)}
.stat-icon.red{background:linear-gradient(135deg,#f43f5e,#e11d48)}
.stat-icon.green{background:linear-gradient(135deg,#22c55e,#16a34a)}
.stat-icon.purple{background:linear-gradient(135deg,#a855f7,#7c3aed)}
.stat-value{font-size:26px;font-weight:700;color:#0f1729;line-height:1}
.stat-label{font-size:11.5px;color:#64748b;margin-top:3px;font-weight:500}

/* Panels */
.panel{background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);border:1px solid #f1f5f9;overflow:hidden}
.panel-header{padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px}
.panel-header svg{width:16px;height:16px;fill:#1a5cff;flex-shrink:0}
.panel-title{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#475569}
.panel-body{padding:18px 20px}
.mb20{margin-bottom:20px}

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

/* Message cards */
.msg-list{display:flex;flex-direction:column;gap:10px}
.msg-card{border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;transition:border-color .15s}
.msg-card.unread{border-left:3px solid #1a5cff;background:#f8faff}
.msg-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.msg-name{font-size:14px;font-weight:700;color:#0f1729}
.msg-name .company{font-weight:400;color:#64748b;font-size:12.5px}
.msg-meta{font-size:12px;color:#64748b;margin-top:2px;display:flex;gap:10px;flex-wrap:wrap}
.msg-meta a{color:#1a5cff;text-decoration:none}
.msg-meta a:hover{text-decoration:underline}
.msg-date{font-size:11.5px;color:#94a3b8;white-space:nowrap}
.msg-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.tag{padding:2px 9px;border-radius:20px;font-size:11px;font-weight:500;background:#eef2ff;color:#4338ca}
.tag.unread-tag{background:#fee2e2;color:#dc2626}
.msg-body{margin-top:10px;font-size:13px;color:#374151;line-height:1.55;white-space:pre-wrap}
.msg-actions{display:flex;gap:14px;margin-top:10px}
.msg-actions a{font-size:12px;font-weight:600;color:#64748b;text-decoration:none;display:flex;align-items:center;gap:4px}
.msg-actions a:hover{color:#1a5cff}
.msg-actions a.danger:hover{color:#dc2626}
.empty-state{text-align:center;padding:48px 0;color:#94a3b8;font-size:13px}

/* Pagination */
.pagination{display:flex;align-items:center;gap:5px;margin-top:18px;flex-wrap:wrap}
.pagination a,.pagination span{padding:6px 11px;border-radius:6px;font-size:12.5px;font-weight:500;text-decoration:none;border:1.5px solid #e2e8f0;color:#475569;background:#fff;transition:all .15s}
.pagination a:hover{background:#1a5cff;color:#fff;border-color:#1a5cff}
.pagination .active{background:#1a5cff;color:#fff;border-color:#1a5cff}
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
  <a class="nav-item" href="../dashboard/index.php">
    <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
    Visitor Tracking
  </a>
  <a class="nav-item active" href="index.php">
    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
    Messages &amp; Quotes
    <?php if ($unreadCount > 0): ?><span class="nav-badge"><?= $unreadCount ?></span><?php endif; ?>
  </a>

  <div class="sidebar-section">System</div>
  <a class="nav-item" href="../dashboard/index.php#login-history">
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
      <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
      Messages &amp; Quote Requests
    </div>
    <div class="topbar-date"><?= date('F j, Y') ?></div>
  </div>

  <div class="content">

    <!-- ── Stats Cards ── -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($totalMessages) ?></div>
          <div class="stat-label">Total Messages</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">
          <svg viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($unreadCount) ?></div>
          <div class="stat-label">Unread</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($quoteCount) ?></div>
          <div class="stat-label">Quote Requests</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <svg viewBox="0 0 24 24"><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></svg>
        </div>
        <div>
          <div class="stat-value"><?= number_format($weekCount) ?></div>
          <div class="stat-label">Last 7 Days</div>
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
            <div class="filter-field"><label>Name</label><input type="text" name="name" value="<?= htmlspecialchars($fName) ?>" placeholder="John Smith"></div>
            <div class="filter-field"><label>Email</label><input type="text" name="email" value="<?= htmlspecialchars($fEmail) ?>" placeholder="name@company.com"></div>
            <div class="filter-field"><label>Service</label><input type="text" name="service" value="<?= htmlspecialchars($fService) ?>" placeholder="Hood Cleaning"></div>
            <div class="filter-field">
              <label>Status</label>
              <select name="status">
                <option value="">All</option>
                <option value="unread" <?= $fStatus==='unread'?'selected':'' ?>>Unread</option>
                <option value="read"   <?= $fStatus==='read'?'selected':''   ?>>Read</option>
              </select>
            </div>
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

    <!-- ── Message List ── -->
    <div class="panel">
      <div class="panel-header">
        <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        <span class="panel-title">Submissions (<?= number_format($totalFiltered) ?>)</span>
      </div>
      <div class="panel-body">
        <?php if (empty($messages)): ?>
          <div class="empty-state">No messages found.</div>
        <?php else: ?>
        <div class="msg-list">
          <?php foreach ($messages as $m):
              $qs = http_build_query(array_filter(['name'=>$fName,'email'=>$fEmail,'service'=>$fService,'status'=>$fStatus,'page'=>$page], fn($v) => $v !== '' && $v !== 0));
          ?>
          <div class="msg-card <?= $m['is_read'] ? '' : 'unread' ?>">
            <div class="msg-top">
              <div>
                <div class="msg-name">
                  <?= htmlspecialchars($m['full_name']) ?>
                  <?php if (!empty($m['company_name'])): ?><span class="company">— <?= htmlspecialchars($m['company_name']) ?></span><?php endif; ?>
                </div>
                <div class="msg-meta">
                  <a href="mailto:<?= htmlspecialchars($m['email']) ?>"><?= htmlspecialchars($m['email']) ?></a>
                  <?php if (!empty($m['phone'])): ?><span><?= htmlspecialchars($m['phone']) ?></span><?php endif; ?>
                </div>
              </div>
              <div class="msg-date"><?= date('M j, Y g:i A', strtotime($m['submitted_at'])) ?></div>
            </div>

            <?php if (!empty($m['service_type']) || !empty($m['service_frequency']) || !empty($m['property_type'])): ?>
            <div class="msg-tags">
              <?php if (!$m['is_read']): ?><span class="tag unread-tag">Unread</span><?php endif; ?>
              <?php if (!empty($m['service_type'])):      ?><span class="tag"><?= htmlspecialchars($m['service_type']) ?></span><?php endif; ?>
              <?php if (!empty($m['service_frequency'])): ?><span class="tag"><?= htmlspecialchars($m['service_frequency']) ?></span><?php endif; ?>
              <?php if (!empty($m['property_type'])):     ?><span class="tag"><?= htmlspecialchars($m['property_type']) ?></span><?php endif; ?>
            </div>
            <?php endif; ?>

            <?php if (!empty($m['message'])): ?>
            <div class="msg-body"><?= nl2br(htmlspecialchars($m['message'])) ?></div>
            <?php endif; ?>

            <div class="msg-actions">
              <?php if ($m['is_read']): ?>
                <a href="index.php?action=unread&id=<?= $m['id'] ?>&qs=<?= urlencode($qs) ?>">Mark unread</a>
              <?php else: ?>
                <a href="index.php?action=read&id=<?= $m['id'] ?>&qs=<?= urlencode($qs) ?>">Mark read</a>
              <?php endif; ?>
              <a href="index.php?action=delete&id=<?= $m['id'] ?>&qs=<?= urlencode($qs) ?>" class="danger" onclick="return confirm('Delete this message?');">Delete</a>
            </div>
          </div>
          <?php endforeach; ?>
        </div>

        <?php if ($totalPages > 1):
          $pbase = 'index.php?' . $currentQuery . ($currentQuery ? '&' : '');
          $range = range(max(1,$page-2), min($totalPages,$page+2));
        ?>
        <div class="pagination">
          <?php if ($page > 1): ?><a href="<?= $pbase ?>page=<?= $page-1 ?>">← Prev</a><?php endif; ?>
          <?php if (!in_array(1,$range)): ?><a href="<?= $pbase ?>page=1">1</a><?php if ($range[0]>2): ?><span class="dots">…</span><?php endif; endif; ?>
          <?php foreach ($range as $p): ?>
            <?= $p==$page ? '<span class="active">'.$p.'</span>' : '<a href="'.$pbase.'page='.$p.'">'.$p.'</a>' ?>
          <?php endforeach; ?>
          <?php if (!in_array($totalPages,$range)): if (end($range)<$totalPages-1): ?><span class="dots">…</span><?php endif; ?><a href="<?= $pbase ?>page=<?= $totalPages ?>"><?= $totalPages ?></a><?php endif; ?>
          <?php if ($page < $totalPages): ?><a href="<?= $pbase ?>page=<?= $page+1 ?>">Next →</a><?php endif; ?>
        </div>
        <?php endif; ?>

        <?php endif; ?>
      </div>
    </div>

  </div>
</div>
</body>
</html>
