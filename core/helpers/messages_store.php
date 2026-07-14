<?php
/**
 * Shared SQLite storage for contact/quote form submissions.
 * Uses the same database file as the visitor tracking admin panel
 * so submissions can be reviewed from the /admin/ dashboard.
 */

define('MESSAGES_DB_PATH', dirname(__DIR__, 2) . '/admin/db/visitor_tracking.db');

function getMessagesDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dir = dirname(MESSAGES_DB_PATH);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $pdo = new PDO('sqlite:' . MESSAGES_DB_PATH, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL');
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS contact_messages (
                id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                submitted_at        DATETIME DEFAULT (datetime('now')),
                full_name           TEXT,
                company_name        TEXT,
                email               TEXT,
                phone               TEXT,
                service_type        TEXT,
                service_frequency   TEXT,
                property_type       TEXT,
                message             TEXT,
                source_url          TEXT,
                is_read             INTEGER DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_cm_submitted_at ON contact_messages(submitted_at);
        ");
    }
    return $pdo;
}
