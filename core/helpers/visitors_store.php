<?php
/**
 * Visitor and Quote Request Management
 * Handles database operations for visitors and quote requests
 */

define('VISITORS_DB_PATH', dirname(__DIR__, 2) . '/admin/db/visitor_tracking.db');

function getVisitorsDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dir = dirname(VISITORS_DB_PATH);
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $pdo = new PDO('sqlite:' . VISITORS_DB_PATH, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA journal_mode=WAL');
        initVisitorsDB($pdo);
    }
    return $pdo;
}

function initVisitorsDB(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS visitors (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at          DATETIME DEFAULT (datetime('now')),
            updated_at          DATETIME DEFAULT (datetime('now')),
            full_name           TEXT NOT NULL,
            email               TEXT,
            phone               TEXT,
            company_name        TEXT,
            job_title           TEXT,
            website             TEXT,
            address             TEXT,
            city                TEXT,
            state               TEXT,
            country             TEXT,
            postal_code         TEXT,
            notes               TEXT,
            status              TEXT DEFAULT 'active',
            ip_address          TEXT,
            source              TEXT,
            last_contact_at     DATETIME,
            is_favorite         INTEGER DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
        CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
        CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
        CREATE INDEX IF NOT EXISTS idx_visitors_company ON visitors(company_name);
        CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);

        CREATE TABLE IF NOT EXISTS quote_requests (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at          DATETIME DEFAULT (datetime('now')),
            updated_at          DATETIME DEFAULT (datetime('now')),
            visitor_id          INTEGER,
            full_name           TEXT NOT NULL,
            email               TEXT NOT NULL,
            phone               TEXT,
            company_name        TEXT,
            service_type        TEXT,
            service_frequency   TEXT,
            property_type       TEXT,
            property_size       TEXT,
            estimated_budget    TEXT,
            message             TEXT,
            attachment_url      TEXT,
            source_url          TEXT,
            source_page         TEXT,
            status              TEXT DEFAULT 'new',
            assigned_to         TEXT,
            priority            TEXT DEFAULT 'normal',
            estimated_date      DATETIME,
            is_read             INTEGER DEFAULT 0,
            is_archived         INTEGER DEFAULT 0,
            notes               TEXT,
            FOREIGN KEY (visitor_id) REFERENCES visitors(id)
        );

        CREATE INDEX IF NOT EXISTS idx_qr_created_at ON quote_requests(created_at);
        CREATE INDEX IF NOT EXISTS idx_qr_email ON quote_requests(email);
        CREATE INDEX IF NOT EXISTS idx_qr_status ON quote_requests(status);
        CREATE INDEX IF NOT EXISTS idx_qr_visitor_id ON quote_requests(visitor_id);
        CREATE INDEX IF NOT EXISTS idx_qr_assigned_to ON quote_requests(assigned_to);
    ");
}

/* ── Visitor Management ───────────────────────────────────────────────── */

function createVisitor(array $data): int {
    $db = getVisitorsDB();
    $stmt = $db->prepare("
        INSERT INTO visitors
            (full_name, email, phone, company_name, job_title, website, address,
             city, state, country, postal_code, notes, status, ip_address, source)
        VALUES
            (:full_name, :email, :phone, :company_name, :job_title, :website, :address,
             :city, :state, :country, :postal_code, :notes, :status, :ip_address, :source)
    ");

    $stmt->execute([
        ':full_name'    => $data['full_name'] ?? null,
        ':email'        => $data['email'] ?? null,
        ':phone'        => $data['phone'] ?? null,
        ':company_name' => $data['company_name'] ?? null,
        ':job_title'    => $data['job_title'] ?? null,
        ':website'      => $data['website'] ?? null,
        ':address'      => $data['address'] ?? null,
        ':city'         => $data['city'] ?? null,
        ':state'        => $data['state'] ?? null,
        ':country'      => $data['country'] ?? null,
        ':postal_code'  => $data['postal_code'] ?? null,
        ':notes'        => $data['notes'] ?? null,
        ':status'       => $data['status'] ?? 'active',
        ':ip_address'   => $data['ip_address'] ?? null,
        ':source'       => $data['source'] ?? null,
    ]);

    return $db->lastInsertId();
}

function getVisitor(int $id): ?array {
    $db = getVisitorsDB();
    $stmt = $db->prepare("SELECT * FROM visitors WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function updateVisitor(int $id, array $data): bool {
    $db = getVisitorsDB();
    $updates = [];
    $params = [':id' => $id];

    foreach ($data as $key => $value) {
        $updates[] = "$key = :$key";
        $params[":$key"] = $value;
    }

    $updates[] = "updated_at = datetime('now')";
    $stmt = $db->prepare("UPDATE visitors SET " . implode(', ', $updates) . " WHERE id = :id");
    return $stmt->execute($params);
}

function deleteVisitor(int $id): bool {
    $db = getVisitorsDB();
    $stmt = $db->prepare("DELETE FROM visitors WHERE id = ?");
    return $stmt->execute([$id]);
}

/* ── Quote Request Management ────────────────────────────────────────── */

function createQuoteRequest(array $data): int {
    $db = getVisitorsDB();
    $stmt = $db->prepare("
        INSERT INTO quote_requests
            (visitor_id, full_name, email, phone, company_name, service_type,
             service_frequency, property_type, property_size, estimated_budget,
             message, attachment_url, source_url, source_page, status, assigned_to,
             priority, estimated_date, notes)
        VALUES
            (:visitor_id, :full_name, :email, :phone, :company_name, :service_type,
             :service_frequency, :property_type, :property_size, :estimated_budget,
             :message, :attachment_url, :source_url, :source_page, :status, :assigned_to,
             :priority, :estimated_date, :notes)
    ");

    $stmt->execute([
        ':visitor_id'        => $data['visitor_id'] ?? null,
        ':full_name'         => $data['full_name'] ?? null,
        ':email'             => $data['email'] ?? null,
        ':phone'             => $data['phone'] ?? null,
        ':company_name'      => $data['company_name'] ?? null,
        ':service_type'      => $data['service_type'] ?? null,
        ':service_frequency' => $data['service_frequency'] ?? null,
        ':property_type'     => $data['property_type'] ?? null,
        ':property_size'     => $data['property_size'] ?? null,
        ':estimated_budget'  => $data['estimated_budget'] ?? null,
        ':message'           => $data['message'] ?? null,
        ':attachment_url'    => $data['attachment_url'] ?? null,
        ':source_url'        => $data['source_url'] ?? null,
        ':source_page'       => $data['source_page'] ?? null,
        ':status'            => $data['status'] ?? 'new',
        ':assigned_to'       => $data['assigned_to'] ?? null,
        ':priority'          => $data['priority'] ?? 'normal',
        ':estimated_date'    => $data['estimated_date'] ?? null,
        ':notes'             => $data['notes'] ?? null,
    ]);

    return $db->lastInsertId();
}

function getQuoteRequest(int $id): ?array {
    $db = getVisitorsDB();
    $stmt = $db->prepare("SELECT * FROM quote_requests WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function updateQuoteRequest(int $id, array $data): bool {
    $db = getVisitorsDB();
    $updates = [];
    $params = [':id' => $id];

    foreach ($data as $key => $value) {
        $updates[] = "$key = :$key";
        $params[":$key"] = $value;
    }

    $updates[] = "updated_at = datetime('now')";
    $stmt = $db->prepare("UPDATE quote_requests SET " . implode(', ', $updates) . " WHERE id = :id");
    return $stmt->execute($params);
}

function deleteQuoteRequest(int $id): bool {
    $db = getVisitorsDB();
    $stmt = $db->prepare("DELETE FROM quote_requests WHERE id = ?");
    return $stmt->execute([$id]);
}

function getQuoteRequests(array $filters = [], int $limit = 50, int $offset = 0): array {
    $db = getVisitorsDB();
    $where = [];
    $params = [];

    if (!empty($filters['status'])) {
        $where[] = "status = :status";
        $params[':status'] = $filters['status'];
    }

    if (!empty($filters['assigned_to'])) {
        $where[] = "assigned_to = :assigned_to";
        $params[':assigned_to'] = $filters['assigned_to'];
    }

    if (!empty($filters['is_archived'])) {
        $where[] = "is_archived = :is_archived";
        $params[':is_archived'] = $filters['is_archived'];
    }

    if (!empty($filters['service_type'])) {
        $where[] = "service_type = :service_type";
        $params[':service_type'] = $filters['service_type'];
    }

    $whereClause = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $stmt = $db->prepare("
        SELECT * FROM quote_requests
        $whereClause
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
    ");

    $stmt->execute(array_values(array_merge($params, [$limit, $offset])));
    return $stmt->fetchAll();
}

function markQuoteAsRead(int $id): bool {
    return updateQuoteRequest($id, ['is_read' => 1]);
}

function archiveQuoteRequest(int $id): bool {
    return updateQuoteRequest($id, ['is_archived' => 1]);
}

function unarchiveQuoteRequest(int $id): bool {
    return updateQuoteRequest($id, ['is_archived' => 0]);
}
