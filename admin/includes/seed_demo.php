<?php
/**
 * Demo data seeder — run once to populate sample visits.
 * Access: /modules/admin/visitor_tracking/seed_demo.php?key=seed2024
 */
if (($_GET['key'] ?? '') !== 'seed2024') {
    http_response_code(403); exit('Forbidden');
}
require_once __DIR__ . '/config.php';
$db = vtGetDB();

$ips = ['50.210.209.33','72.14.192.1','66.249.64.10','17.58.97.3','185.220.101.45','8.8.8.8','94.142.241.100','203.113.52.77'];
$countries = ['United States','United States','United States','Singapore','Lithuania','France','Netherlands','Local Network'];
$cities    = ['Houston','New York','Mountain View','Singapore','Vilnius','Paris','Amsterdam',''];
$isps      = ['Comcast Cable Co.','AT&T Services','Google LLC','Amazon.com','Telia Company','Orange SA','KPN','Local Network'];
$browsers  = ['Google Chrome','Google Chrome','Google Chrome','Microsoft Edge','Safari','Mozilla Firefox','Google Chrome','Unknown'];
$oses      = ['Windows','Windows','macOS','Windows','macOS','Windows','Linux','Windows'];
$devices   = ['Desktop','Desktop','Desktop','Desktop','Mobile','Desktop','Desktop','Desktop'];
$urls      = ['/modules/admin/visitor_tracking/','/form_contract/load_drafts_by_seller.php?page=1&limit=20','/contract_generator/controllers/get_completed_requests.php','/public/index.php?action=login','/','/contract_generator/','/billing/'];
$referers  = ['https://sales.primefsgroup.com/','https://google.com/','','https://sales.primefsgroup.com/dashboard'];

$count = 0;
$stmt  = $db->prepare("INSERT INTO vt_visits (visited_at,ip_address,country,city,isp,browser,browser_ver,os,device,url_visited,referer,user_agent,username) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");

for ($i = 0; $i < 500; $i++) {
    $idx = rand(0, count($ips)-1);
    $daysAgo = rand(0, 30);
    $secsAgo = rand(0, 86400);
    $ts = date('Y-m-d H:i:s', time() - $daysAgo*86400 - $secsAgo);
    $stmt->execute([
        $ts,
        $ips[$idx],
        $countries[$idx],
        $cities[$idx],
        $isps[$idx],
        $browsers[rand(0,count($browsers)-1)],
        rand(100,120).'.0.0',
        $oses[rand(0,count($oses)-1)],
        $devices[rand(0,count($devices)-1)],
        $urls[rand(0,count($urls)-1)],
        $referers[rand(0,count($referers)-1)],
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Demo',
        rand(0,3)===0 ? 'admin' : '',
    ]);
    $count++;
}

echo "✅ Inserted $count demo visits. <a href='index.php'>Go to dashboard →</a>";
