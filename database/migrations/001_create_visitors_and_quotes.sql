-- Migration: Create Visitors and Quote Requests tables
-- Date: 2026-07-02
-- Description: Adds comprehensive visitor tracking and quote request management

-- Create visitors table for storing detailed visitor/contact information
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

-- Create indexes for visitors table
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_company ON visitors(company_name);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);

-- Create quote_requests table for detailed quote/request information
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

-- Create indexes for quote_requests table
CREATE INDEX IF NOT EXISTS idx_qr_created_at ON quote_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_qr_email ON quote_requests(email);
CREATE INDEX IF NOT EXISTS idx_qr_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_qr_visitor_id ON quote_requests(visitor_id);
CREATE INDEX IF NOT EXISTS idx_qr_assigned_to ON quote_requests(assigned_to);

-- Table Descriptions:
-- visitors:
--   - Stores detailed information about visitors/contacts
--   - full_name: Person's complete name
--   - email: Contact email address
--   - phone: Contact phone number
--   - company_name: Company or organization name
--   - job_title: Position or role
--   - website: Company website or personal website
--   - address: Full physical address
--   - city, state, country, postal_code: Location details
--   - notes: Internal notes about the visitor
--   - status: active, inactive, archived, or other custom statuses
--   - ip_address: IP address of first contact
--   - source: How they found us (referral, search, direct, etc.)
--   - last_contact_at: Timestamp of last interaction
--   - is_favorite: Flag for priority contacts

-- quote_requests:
--   - Stores quote/proposal requests from visitors
--   - visitor_id: Foreign key linking to visitors table (nullable for anonymous requests)
--   - full_name, email, phone, company_name: Requestor information
--   - service_type: Type of service requested
--   - service_frequency: How often the service is needed
--   - property_type: Type of property (residential, commercial, industrial, etc.)
--   - property_size: Size or square footage
--   - estimated_budget: Budget range or amount
--   - message: Detailed message or requirements
--   - attachment_url: URL to any attachments (images, documents)
--   - source_url: URL of the page where the request was submitted
--   - source_page: Name or identifier of the source page
--   - status: new, quoted, accepted, rejected, completed, etc.
--   - assigned_to: User who is handling this request
--   - priority: high, normal, low
--   - estimated_date: When the service is needed
--   - is_read: Whether the request has been viewed
--   - is_archived: Whether the request has been archived
--   - notes: Internal notes and follow-up information
