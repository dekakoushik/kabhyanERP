# Kabhyan ERP - Implementation Progress & Changelog

## [Phase 1: Foundation & SuperAdmin + User Management] - COMPLETED
- Configured MariaDB `kabhyan_erp` & Redis port 6379.
- Laravel 13 Sanctum REST API + Redis session caching.
- Next.js 16 Corporate UI with mobile drawer & responsive data tables.
- Seeded accounts: `superadmin@kabhyan.com`, `admin@kabhyan.com`, `hr@kabhyan.com`, `dev@kabhyan.com` (password: `Kabhyan@2026`).

---

## [Phase 2: Project & Task Management Module] - COMPLETED
- Full project portfolio tracking with codes, deadlines, budget, manager and team assignments.
- Agile Kanban Board with 5 pipeline columns (To Do, In Progress, In Review, Done, Blocked) and quick status steppers.
- Real-time automated project completion progress recalculation.

---

## [Phase 3: Client Estimate & Quotation Generation Module] - COMPLETED & UPDATED
- Currency configured in **INR (₹)** with Indian grouping locale (`en-IN`) formatting.
- GST / Tax handling configured with default 18% GST standard.
- Seeded estimates in INR with Indian business pricing and clients.
- Interactive proposal builder modal and printable PDF templates configured with ₹ currency symbols.

---

## [Phase 4: Proforma Invoice Generation (PI) Module] - COMPLETED

### 1. Database & Model Architecture
- **`proforma_invoices` table**:
  - `proforma_number` (unique, e.g. `PI-2026-001`), `estimate_id` (foreign key to source estimate), `project_id`, `created_by`, `client_name`, `client_company`, `client_email`, `client_phone`, `client_address`, `invoice_date`, `due_date`, `status` (`unpaid`, `partially_paid`, `paid`, `cancelled`), `currency` (defaults to `INR`), `subtotal`, `tax_rate`, `tax_amount`, `discount_rate`, `discount_amount`, `total_amount`, `paid_amount`, `notes`, `terms_and_conditions`, `bank_details`.
  - Automatic `recalculateTotals()` method computing line totals, GST/Tax, and net payable.
- **`proforma_invoice_items` table**:
  - Itemized rows linked to proforma invoice with quantity, unit, unit price, and total amount.

### 2. Laravel REST APIs
- `POST /api/v1/estimates/{estimate}/convert-to-proforma`:
  - Validates estimate status is `accepted`.
  - Generates next sequential `PI-YYYY-XXX` identifier.
  - Duplicates client metadata, project reference, currency (₹), and line items.
  - Attaches standard beneficiary bank wire details (HDFC Bank, IFSC, UPI ID).
  - Automatically transitions estimate status to `invoiced`.
- `GET /api/v1/proforma-invoices`: Search, status filter, and live financial ledger analytics (Unpaid, Paid/Realized, Total Value).
- `POST /api/v1/proforma-invoices`: Create standalone proforma invoice.
- `GET /api/v1/proforma-invoices/{id}`: Detailed PI breakdown.
- `PUT /api/v1/proforma-invoices/{id}`: Edit proforma details and items.
- `PATCH /api/v1/proforma-invoices/{id}/status`: Quick payment status update (`unpaid`, `partially_paid`, `paid`, `cancelled`).
- `DELETE /api/v1/proforma-invoices/{id}`: Soft delete.

### 3. Next.js Corporate UI
- **One-Click Estimate Conversion** on [`/dashboard/estimates`](http://localhost:3000/dashboard/estimates):
  - When an estimate is in **Accepted** status, a vibrant green **"Make Proforma"** button appears in the action column and within the preview modal toolbar.
  - Clicking **"Make Proforma"** triggers the backend conversion, marks the estimate as `invoiced`, and automatically routes directly to the created Proforma Invoice.
  - When already invoiced, a **"View PI"** pill appears for immediate reference.
- **Proforma Invoices Hub ([`/dashboard/proforma`](http://localhost:3000/dashboard/proforma))**:
  - Dedicated navigation item in persistent sidebar.
  - Financial metric cards: Total Proformas, Unpaid / Pending Value, Paid / Realized Value, and Paid Count.
  - Data table with client names, source estimate tags, due dates, ₹ amounts, and payment status selectors.
  - **Full Document Print / PDF Preview**:
    - Official **Kabhyan Technologies** corporate logo and address.
    - Reference link to approved Estimate and Project Code.
    - Itemized deliverables ledger with GST (18%).
    - **Beneficiary Bank Remittance Details Box** (Bank Name, Account Number, IFSC Code, UPI ID).
    - Authorized Signatory signature block.
    - 1-click browser Print / Save as PDF button.

---

## [Phase 5: Tax Invoice & Complete Business Flow] - COMPLETED

### Complete Workflow Pipeline
$$\text{Estimate (Accepted)} \longrightarrow \text{Proforma Invoice (PI)} \longrightarrow \text{Tax Invoice (INV)}$$

1. **Estimate**: Created with itemized services, 18% GST, and INR formatting. Accepted by client.
2. **Proforma Invoice (PI)**: Generated in 1-click from accepted estimate (`POST /api/v1/estimates/{id}/convert-to-proforma`), carrying advance payment terms and bank wire remittance details.
3. **Tax Invoice (INV)**: Generated in 1-click from Proforma Invoice (`POST /api/v1/proforma-invoices/{id}/convert-to-invoice`) or created standalone, complete with GSTIN, SAC Code `998314`, CGST/SGST/IGST breakdown, payment ledger with transaction references (UTR/NEFT/Cheque/UPI), and real-time revenue KPIs.

### 1. Database & Model Architecture
- **`invoices` table (`backend/database/migrations/2026_11_10_045916_create_invoices_table.php`)**:
  - `invoice_number` (unique `INV-YYYY-XXX`), `proforma_invoice_id`, `estimate_id`, `project_id`, `created_by`, `client_name`, `client_company`, `client_gstin`, `client_email`, `client_phone`, `client_address`, `invoice_date`, `due_date`, `status` (`unpaid`, `partially_paid`, `paid`, `overdue`, `cancelled`), `currency` (`INR`), `subtotal`, `tax_rate`, `tax_amount`, `cgst_rate`, `cgst_amount`, `sgst_rate`, `sgst_amount`, `igst_rate`, `igst_amount`, `discount_rate`, `discount_amount`, `total_amount`, `paid_amount`, `due_amount`, `notes`, `terms_and_conditions`, `bank_details`.
  - Automatic `recalculateTotals()` method calculating GST breakdown and auto-updating payment status based on `paid_amount` vs `total_amount`.
- **`invoice_items` table (`backend/database/migrations/2026_11_10_045917_create_invoice_items_table.php`)**:
  - Itemized services with IT Consultancy & Software Development SAC Code `998314`, quantity, unit, unit rate, and total line amount.
- **`invoice_payments` table (`backend/database/migrations/2026_11_10_045918_create_invoice_payments_table.php`)**:
  - Realized payment transactions logging `amount`, `payment_date`, `payment_method` (`bank_transfer`, `upi`, `neft`, `rtgs`, `cheque`, `cash`, `card`), `transaction_reference` (UTR number), and `recorded_by`.

### 2. Laravel REST APIs (`backend/routes/api.php`)
- `POST /api/v1/proforma-invoices/{id}/convert-to-invoice`: Converts PI into a GST Tax Invoice, copying items, calculating GST, and transferring advances.
- `GET /api/v1/invoices`: Returns paginated invoices with live revenue KPIs (`total_invoiced_value`, `total_collected_value`, `total_outstanding_value`, `overdue` count).
- `POST /api/v1/invoices`: Manual generation of GST Tax Invoices.
- `GET /api/v1/invoices/{id}`: Detailed invoice view with items, payments, and client profile.
- `PUT /api/v1/invoices/{id}`: Edit invoice details.
- `PATCH /api/v1/invoices/{id}/status`: Quick status updates.
- `POST /api/v1/invoices/{id}/payments`: Records partial or full client payment transactions with UTR reference, recalculating outstanding balance.
- `DELETE /api/v1/invoices/{id}`: Soft delete invoice.

### 3. Next.js Corporate UI & Pages
- **Sidebar Navigation**: Added **Tax Invoices** ([`/dashboard/invoices`](http://localhost:3000/dashboard/invoices)) with active indicator.
- **Proforma Hub Integration**: Added **"Make Tax Invoice"** action directly on proforma table rows and inside the document preview toolbar.
- **Tax Invoice Dashboard ([`/dashboard/invoices`](http://localhost:3000/dashboard/invoices))**:
  - 4 Executive Financial KPI Cards: Total Invoiced, Total Collected, Outstanding Due, and Overdue Alerts.
  - Search and filter bar by status and client.
  - Interactive "Record Payment" modal with payment mode selection and UTR / transaction ID capture.
  - **Formal Corporate GST Tax Invoice Print / PDF View**:
    - Official Kabhyan Technologies corporate logo.
    - Company GSTIN (`19AABCK9876Q1Z2`), West Bengal State Code `19`, and PAN.
    - Client GSTIN and full billing address.
    - SAC Code `998314` on service line items.
    - CGST 9% + SGST 9% or IGST 18% tax breakdown.
    - Company HDFC Bank wire transfer details.
    - Payment Realization History box.
    - Authorized signatory signature block.

---

## [Phase 6: Income vs Expense & Financial Accounts Ledger] - COMPLETED

### 1. Database Architecture
- **`expense_categories` table (`backend/database/migrations/2026_11_10_051001_create_expense_categories_table.php`)**:
  - `name`, `slug`, `color`, `description`, `is_active`.
  - Seeded with core IT business categories: *Cloud Infrastructure & Hosting*, *Salaries & Contractor Payouts*, *Software Licenses & Subscriptions*, *Office Space & Co-working Utilities*, *Marketing & Client Acquisition*, *Legal, Accounting & Compliance*.
- **`expenses` table (`backend/database/migrations/2026_11_10_051002_create_expenses_table.php`)**:
  - `expense_number` (`EXP-YYYY-XXX`), `expense_category_id`, `project_id`, `created_by`, `title`, `description`, `vendor_name`, `vendor_gstin`, `expense_date`, `amount`, `tax_amount` (claimable Input Tax Credit / ITC), `total_amount`, `currency` (`INR`), `payment_method`, `transaction_reference`, `status` (`paid`, `pending`, `cancelled`), `receipt_attachment`, `notes`.

### 2. Laravel REST APIs
- `GET /api/v1/financial-reports/income-vs-expense`:
  - Returns corporate Profit & Loss (P&L) metrics for any fiscal year:
    - **Total Collected Income**: Sum of all realized client invoice payments.
    - **Total Invoiced Gross & Outstanding Due**: Client receivables tracking.
    - **Total Operational Expenses**: Disbursed vendor payouts.
    - **GST Input Tax Credit (ITC)**: Claimable tax paid on AWS, rent, and software.
    - **Net Operating Profit & Margin %**: Calculated as $\text{Total Income} - \text{Total Expenses}$.
    - **12-Month Cashflow Array**: Side-by-side monthly income, expense, and net variance.
    - **Category Expense Breakdown**: Category totals and percentage shares.
    - **Unified Cashflow Feed**: Combined chronologically ordered transaction ledger.
- `GET /api/v1/expenses`: Filterable list by category, project, status, and search keywords.
- `POST /api/v1/expenses`: Create new expense voucher with automatic total and tax calculations.
- `PUT /api/v1/expenses/{id}`: Update expense record.
- `DELETE /api/v1/expenses/{id}`: Soft delete voucher.
- `GET /api/v1/expenses/categories`: Active categories list with expense counts.

### 3. Next.js Corporate UI
- **Sidebar Integration**:
  - Added **Income vs Expense** ([`/dashboard/accounts`](http://localhost:3000/dashboard/accounts)) and **Expense Tracking** ([`/dashboard/expenses`](http://localhost:3000/dashboard/expenses)).
- **Financial Accounts Hub ([`/dashboard/accounts`](http://localhost:3000/dashboard/accounts))**:
  - 4 Executive Financial KPI Cards: Total Income Realized, Total Expenses Paid, Net Operating Profit (with Profit Margin % badge), and Outstanding Due.
  - Interactive Fiscal Year selector (`FY 2026`, `FY 2025`, etc.).
  - Side-by-side **12-Month Bar Chart** comparing monthly collections vs operational burn.
  - Financial multiple metrics (Average monthly revenue, monthly burn, cashflow multiple, tax deductible ratio).
  - Category breakdown progress bars with customized color coding.
  - Unified Cashflow Transactions stream linking client payments and vendor disbursements.
- **Corporate Expense Management ([`/dashboard/expenses`](http://localhost:3000/dashboard/expenses))**:
  - Vouchers data table with category badges, vendor GSTIN, UTR references, and payment method tags.
  - Expense modal for logging disbursements with instant total calculations and project attribution.

---

## [Phase 7: Client Management & Self-Service Client Portal] - COMPLETED

### Complete Client Lifecycle & Support Flow
$$\text{Client Account Provisioned} \longrightarrow \text{Project Linked} \longrightarrow \text{Client Logs In (/portal)} \longrightarrow \text{Raises Ticket} \longleftrightarrow \text{ERP Staff Reply (/dashboard/tickets)}$$

### 1. Database Architecture
- **`clients` table (`backend/database/migrations/2026_11_10_053001_create_clients_table.php`)**:
  - `user_id` (foreign key to `users` for client portal login authentication).
  - `client_code` (unique `CLI-YYYY-XXX`), `name`, `company_name`, `email`, `phone`, `gstin`, `address`, `city`, `state`, `country`, `portal_access_status` (`active`, `inactive`), `notes`.
  - Added `client_id` foreign key to `projects` table.
- **`tickets` table (`backend/database/migrations/2026_11_10_053002_create_tickets_table.php`)**:
  - `ticket_number` (unique `TIK-YYYY-XXX`), `client_id`, `project_id`, `assigned_to` (engineer), `subject`, `type` (`issue`, `change_request`, `improvement`, `query`, `billing`), `priority` (`low`, `medium`, `high`, `critical`), `status` (`open`, `in_progress`, `awaiting_client_reply`, `resolved`, `closed`), `description`, `attachments`, `resolved_at`.
- **`ticket_replies` table**:
  - Thread replies linking `ticket_id`, `user_id` (staff), `client_id` (client), `message`, `is_staff_reply`.

### 2. Laravel REST APIs
- **Client Management (ERP Staff)**:
  - `GET /api/v1/clients`: Paginated clients with active project counts, open tickets, and portal login status.
  - `POST /api/v1/clients`: Register client and automatically provision portal user login account (`role: client`).
  - `PUT /api/v1/clients/{id}`: Update client profile and reset portal passwords.
  - `DELETE /api/v1/clients/{id}`: Soft delete client.
- **Ticket Management (ERP Staff)**:
  - `GET /api/v1/tickets`: Full ticket feed with filters for project, client, classification type, and priority.
  - `POST /api/v1/tickets`: Staff logs ticket on behalf of client.
  - `GET /api/v1/tickets/{id}`: Thread details with reply conversation history.
  - `PUT /api/v1/tickets/{id}`: Assign engineer, change status, or reprioritize.
  - `POST /api/v1/tickets/{id}/reply`: Post staff response, automatically setting status to `awaiting_client_reply` or `resolved`.
- **Client Portal Endpoints (`/api/v1/portal/*`)**:
  - `GET /api/v1/portal/dashboard`: Dedicated client dashboard aggregating their commissioned projects, milestone completion %, recent tickets, and financial invoices.
  - `GET /api/v1/portal/projects`: Projects and task deliverables for the logged-in client.
  - `GET /api/v1/portal/projects/{id}`: In-depth project view with milestones and tasks.
  - `GET /api/v1/portal/tickets`: Client's own tickets.
  - `POST /api/v1/portal/tickets`: Client raises an issue, change request, improvement, or query.
  - `GET /api/v1/portal/tickets/{id}`: Client views ticket conversation.
  - `POST /api/v1/portal/tickets/{id}/reply`: Client posts follow-up message, transitioning status to `in_progress`.

### 3. Next.js Corporate UI
- **Sidebar Integration**:
  - Added **Clients** ([`/dashboard/clients`](http://localhost:3000/dashboard/clients)).
  - Added **Support Tickets** ([`/dashboard/tickets`](http://localhost:3000/dashboard/tickets)).
- **Project Linking**:
  - Updated **Project Creation / Edit Modal** on [`/dashboard/projects`](http://localhost:3000/dashboard/projects) with a dedicated dropdown to select any client account.
- **Client Management Workspace ([`/dashboard/clients`](http://localhost:3000/dashboard/clients))**:
  - Client accounts data table, GSTIN, city, project counter badge, and portal access toggle.
  - 1-click button to open Client Portal in new tab.
  - Client modal with automatic portal login provisioning (`Client@2026`).
- **Support & Change Request Hub ([`/dashboard/tickets`](http://localhost:3000/dashboard/tickets))**:
  - Filterable by type (Bug, Change Request, Improvement), status, and priority.
  - Real-time conversation thread modal with color-coded staff vs client chat bubbles and quick status transitions.
- **Dedicated Client Portal ([`/portal`](http://localhost:3000/portal))**:
  - Executive header with Kabhyan Technologies corporate branding.
  - 3 dynamic tabs:
    1. **Overview**: Greeting banner, project milestone progress bars, active deliverables, and recent tickets.
    2. **My Projects**: Sprint backlog, completed tasks, and deadlines.
    3. **Tickets & Support**: Self-service ticket creation modal and interactive conversation thread.

---

## [Phase 8: System Settings & Infrastructure Configuration Module] - COMPLETED

### 1. Database Architecture
- **`system_settings` table (`backend/database/migrations/2026_11_10_054501_create_system_settings_table.php`)**:
  - `key` (unique slug), `value`, `group` (`company`, `tax_compliance`, `banking`, `localization`, `security_policy`), `type` (`string`, `text`, `number`, `boolean`, `json`), `description`.
  - Eloquent `SystemSetting` model with automatic cache-aside pattern via Redis (`Cache::remember`).

### 2. Laravel REST APIs
- `GET /api/v1/settings`:
  - Returns grouped dictionary of system settings.
  - Returns live **Server Environment & Health Diagnostic** (Redis connection ping, MariaDB PDO status, PHP runtime version, Laravel version, cache driver, server timestamp, timezone).
- `POST /api/v1/settings`:
  - Bulk updates settings and automatically flushes Redis cache keys (`Cache::forget`).
- `POST /api/v1/settings/flush-cache`:
  - Flushes application Cache and executes Redis `flushall`.

### 3. Next.js Corporate UI
- **Sidebar Integration**:
  - Activated **System Settings** ([`/dashboard/settings`](http://localhost:3000/dashboard/settings)).
- **Configuration Hub ([`/dashboard/settings`](http://localhost:3000/dashboard/settings))**:
  - **Company Profile Tab**: Corporate legal name, official sub-tagline, email, phone, website, and physical HQ address.
  - **Tax & GST Compliance Tab**: Corporate GSTIN (`19AABCK9876Q1Z2`), PAN (`AABCK9876Q`), default IT SAC Code (`998314`), and default standard GST rate (18%).
  - **Banking & Wire Remittance Tab**: Partner bank (HDFC Bank), account title, account number, RTGS/NEFT IFSC code, branch, and merchant UPI ID.
  - **Localization & Formats Tab**: Operating currency (INR / ₹), date formats (`YYYY-MM-DD`, `DD-MM-YYYY`), and timezone (`Asia/Kolkata`).
  - **Security & Portal Policies Tab**: Self-service client portal toggle, email notification rules, and Redis session timeout settings.
  - **Infrastructure & Redis Health Tab**: Live visual indicators of Redis Cache node and MariaDB connection, server framework version, and one-click "Flush Cache" trigger.

---

## [Phase 9: Production Dockerization & Dokploy Cloud Deployment] - COMPLETED

### 1. Backend Docker Container (`backend/Dockerfile`)
- Multi-stage build (Composer 2 build stage + PHP 8.3-FPM Alpine runtime).
- Bundled with **Nginx 1.26** reverse proxy and **Supervisor** managing PHP-FPM and Nginx simultaneously.
- Automated entrypoint script (`backend/docker/entrypoint.sh`):
  - Validates and creates storage permissions.
  - Automatically runs `php artisan key:generate` if missing.
  - Automatically executes database migrations (`RUN_MIGRATIONS=true`).
  - Pre-compiles production caches (`config:cache`, `route:cache`, `view:cache`).
- OPcache optimized for high throughput.

### 2. Frontend Docker Container (`frontend/Dockerfile`)
- Multi-stage build (Alpine Node 20):
  - `deps` stage: Clean cached dependencies with `npm ci`.
  - `builder` stage: Standalone Next.js production build (`output: "standalone"`).
  - `runner` stage: Minimal secure non-root image with zero unnecessary devDependencies.
- Exposes port `3000`.

### 3. Orchestration & Dokploy Deployment (`docker-compose.yml`)
- Complete 4-service stack:
  1. **`mariadb`**: MariaDB 11.4 with healthcheck probe and persistent volume.
  2. **`redis`**: Redis 7-Alpine with AOF persistence and healthcheck probe.
  3. **`backend`**: Laravel 13 API on port `8000`.
  4. **`frontend`**: Next.js 16 UI on port `3000`.
- `.env.example`: Complete environment template.
- `DOKPLOY_DEPLOYMENT.md`: Step-by-step production deployment guide for Dokploy / Traefik.
