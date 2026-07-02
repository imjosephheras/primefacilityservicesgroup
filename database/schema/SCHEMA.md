# Database Schema Documentation

## Overview
This SQLite database stores visitor tracking information, login history, contact messages, visitor details, and quote requests for the Prime Facility Services Group system.

Database file location: `/admin/db/visitor_tracking.db`

---

## Tables

### 1. `vt_visits` (Automated Visit Tracking)
Automatically tracks every page visit on the website using a transparent pixel tracker.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| visited_at | DATETIME | When the visit occurred (auto-set) |
| visitor_id | TEXT | Unique visitor identifier (1-year cookie) |
| session_id | TEXT | Session identifier (per-session cookie) |
| ip_address | TEXT | Visitor's IP address |
| country | TEXT | Visitor's country |
| state | TEXT | Visitor's state/region |
| city | TEXT | Visitor's city |
| isp | TEXT | Internet service provider |
| browser | TEXT | Browser name (Chrome, Firefox, Safari, etc.) |
| browser_ver | TEXT | Browser version |
| os | TEXT | Operating system (Windows, macOS, Linux, Android, iOS) |
| device | TEXT | Device type (Desktop, Mobile, Tablet) |
| user_agent | TEXT | Raw user agent string |
| url_visited | TEXT | Full URL of visited page |
| referer | TEXT | Referrer URL |
| language | TEXT | Browser language setting |
| timestamp | INTEGER | Unix timestamp |

**Indexes:**
- idx_vt_visited_at
- idx_vt_visitor_id
- idx_vt_session_id
- idx_vt_ip
- idx_vt_country

**Usage:** Automatically populated via `/admin/visitors/tracker.php`

---

### 2. `vt_login_history` (Admin Login Tracking)
Tracks login attempts and authentication events in the admin panel.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| logged_at | DATETIME | When the login attempt occurred (auto-set) |
| username | TEXT | Username attempting to login |
| ip_address | TEXT | Login source IP |
| country | TEXT | Geolocation country |
| state | TEXT | Geolocation state |
| city | TEXT | Geolocation city |
| isp | TEXT | Geolocation ISP |
| browser | TEXT | Browser used |
| os | TEXT | Operating system |
| device | TEXT | Device type |
| latitude | REAL | Geolocation latitude |
| longitude | REAL | Geolocation longitude |
| accuracy | REAL | Geolocation accuracy in meters |
| geo_status | TEXT | Geolocation status |
| login_status | TEXT | Success/failure status |

**Indexes:**
- idx_lh_logged_at

**Usage:** Manually populated in admin login/logout handlers

---

### 3. `contact_messages` (Contact Form Submissions)
Stores messages submitted through the contact/quote form on the website.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| submitted_at | DATETIME | When the message was submitted (auto-set) |
| full_name | TEXT | Visitor's full name |
| company_name | TEXT | Visitor's company |
| email | TEXT | Contact email |
| phone | TEXT | Contact phone |
| service_type | TEXT | Type of service requested |
| service_frequency | TEXT | Service frequency preference |
| property_type | TEXT | Type of property (residential, commercial, etc.) |
| message | TEXT | Message body |
| source_url | TEXT | URL where form was submitted |
| is_read | INTEGER | Whether the message has been read (0 or 1) |

**Indexes:**
- idx_cm_submitted_at

**Usage:** Populated via `/api/contact/send.php`

---

### 4. `visitors` (Visitor Contact Database)
Stores detailed information about visitors/potential customers who have provided their contact information.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| created_at | DATETIME | When the record was created (auto-set) |
| updated_at | DATETIME | When the record was last updated (auto-set) |
| full_name | TEXT | Visitor's full name (required) |
| email | TEXT | Email address |
| phone | TEXT | Phone number |
| company_name | TEXT | Company or organization name |
| job_title | TEXT | Job title or position |
| website | TEXT | Website URL |
| address | TEXT | Street address |
| city | TEXT | City |
| state | TEXT | State/province |
| country | TEXT | Country |
| postal_code | TEXT | Postal/ZIP code |
| notes | TEXT | Internal notes about the visitor |
| status | TEXT | Status: 'active', 'inactive', 'archived', etc. (default: 'active') |
| ip_address | TEXT | IP address from first contact |
| source | TEXT | How they found us: 'referral', 'search', 'direct', 'social', etc. |
| last_contact_at | DATETIME | Timestamp of last contact |
| is_favorite | INTEGER | Flag for high-priority/favorite contacts (0 or 1) |

**Indexes:**
- idx_visitors_created_at
- idx_visitors_email
- idx_visitors_phone
- idx_visitors_company
- idx_visitors_status

**Usage:** Can be populated via visitor registration form or created manually in admin panel

---

### 5. `quote_requests` (Quotation/Proposal Requests)
Stores detailed quote requests with full tracking and workflow management.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| created_at | DATETIME | When the request was created (auto-set) |
| updated_at | DATETIME | When the request was last updated (auto-set) |
| visitor_id | INTEGER | Foreign key to visitors table (nullable for anonymous requests) |
| full_name | TEXT | Requestor's full name (required) |
| email | TEXT | Contact email (required) |
| phone | TEXT | Contact phone |
| company_name | TEXT | Company name |
| service_type | TEXT | Service type: 'cleaning', 'maintenance', 'repairs', etc. |
| service_frequency | TEXT | Frequency: 'one-time', 'weekly', 'monthly', 'quarterly', 'yearly' |
| property_type | TEXT | Property type: 'residential', 'commercial', 'industrial', 'mixed' |
| property_size | TEXT | Property size in sq ft or description |
| estimated_budget | TEXT | Budget range or amount |
| message | TEXT | Detailed requirements and messages |
| attachment_url | TEXT | URL to uploaded documents/images |
| source_url | TEXT | URL of the page where request was submitted |
| source_page | TEXT | Name of the source page |
| status | TEXT | Status: 'new', 'quoted', 'accepted', 'rejected', 'completed', etc. (default: 'new') |
| assigned_to | TEXT | Username of assigned team member |
| priority | TEXT | Priority: 'high', 'normal', 'low' (default: 'normal') |
| estimated_date | DATETIME | When the service is needed |
| is_read | INTEGER | Whether the request has been read (0 or 1) |
| is_archived | INTEGER | Whether the request has been archived (0 or 1) |
| notes | TEXT | Internal notes and follow-up information |

**Foreign Keys:**
- visitor_id → visitors.id (CASCADE on delete)

**Indexes:**
- idx_qr_created_at
- idx_qr_email
- idx_qr_status
- idx_qr_visitor_id
- idx_qr_assigned_to

**Usage:** Populated via quote request form or admin panel

---

## Data Flow

```
Website Visitor
    ↓
vt_visits (automatic pixel tracking)
    ↓
Fills Contact/Quote Form
    ├→ contact_messages (legacy)
    └→ quote_requests (new, with more structure)
         + Optional: creates/links visitors record
    ↓
Admin Reviews & Manages
    ↓
Updates status, assigns to team, adds notes
```

---

## Helper Functions

Located in `/core/helpers/visitors_store.php`:

### Visitor Management
- `createVisitor(array $data): int` - Create new visitor record
- `getVisitor(int $id): ?array` - Get visitor by ID
- `updateVisitor(int $id, array $data): bool` - Update visitor record
- `deleteVisitor(int $id): bool` - Delete visitor record

### Quote Request Management
- `createQuoteRequest(array $data): int` - Create new quote request
- `getQuoteRequest(int $id): ?array` - Get quote request by ID
- `updateQuoteRequest(int $id, array $data): bool` - Update quote request
- `deleteQuoteRequest(int $id): bool` - Delete quote request
- `getQuoteRequests(array $filters, int $limit, int $offset): array` - Get filtered list
- `markQuoteAsRead(int $id): bool` - Mark as read
- `archiveQuoteRequest(int $id): bool` - Archive quote
- `unarchiveQuoteRequest(int $id): bool` - Unarchive quote

---

## Usage Examples

### Create a Visitor
```php
require_once '/core/helpers/visitors_store.php';

$visitorId = createVisitor([
    'full_name'    => 'John Smith',
    'email'        => 'john@example.com',
    'phone'        => '+1234567890',
    'company_name' => 'ABC Corp',
    'job_title'    => 'Facilities Manager',
    'city'         => 'New York',
    'state'        => 'NY',
    'country'      => 'USA',
    'source'       => 'referral',
    'ip_address'   => $_SERVER['REMOTE_ADDR'],
]);
```

### Create a Quote Request
```php
$quoteId = createQuoteRequest([
    'visitor_id'      => $visitorId,
    'full_name'       => 'John Smith',
    'email'           => 'john@example.com',
    'phone'           => '+1234567890',
    'company_name'    => 'ABC Corp',
    'service_type'    => 'cleaning',
    'service_frequency' => 'weekly',
    'property_type'   => 'commercial',
    'property_size'   => '5000 sq ft',
    'estimated_budget' => '$5000-$10000/month',
    'message'         => 'We need regular cleaning services...',
    'source_url'      => 'https://example.com/contact',
    'priority'        => 'high',
]);
```

### Get Filtered Quote Requests
```php
$quotes = getQuoteRequests([
    'status' => 'new',
    'assigned_to' => null,
], 20, 0); // 20 items per page, first page

foreach ($quotes as $quote) {
    echo "{$quote['full_name']} - {$quote['service_type']} - {$quote['status']}\n";
}
```

---

## Notes

- Both `visitors` and `quote_requests` tables use SQLite's `AUTOINCREMENT` for IDs
- Date/time fields default to current UTC time via `datetime('now')`
- Foreign keys are enforced but deletion is not cascaded (manual cascade in PHP code)
- Timestamps are sortable and queryable using SQLite's datetime functions
- All indexes are created on first database initialization
- The `is_read` and `is_archived` fields use INTEGER (0/1) for boolean values (SQLite convention)
