# Kabhyan ERP Agent Guidelines & System Architecture

This repository contains the enterprise ERP system for **Kabhyan Technologies Private Limited**, comprising a Laravel 12 Sanctum backend and a Next.js 15 (React 19) App Router frontend.

---

## Strict Development Rules & Architectural Principles

### 1. Dedicated Page Architecture (Mandatory)
- **No Creation Modals**: All entity creation (Estimates/Quotations, Proforma Invoices, Tax Invoices, Projects, Clients, Tickets) **must** use dedicated full-page routes (`/dashboard/{resource}/create`), never modal dialogs.
- **Unified Action CTAs**: Every button that creates a resource—whether located in the top header, inside table empty states, or within dashboard overview widgets—must navigate to `/dashboard/{resource}/create` via `<Link>`.
- **Reference**: See `.agents/rules/dedicated-page-architecture.md` for complete specification.

### 2. Client Auto-Fetch Standard
- When creating Quotations, Proforma Invoices, or Tax Invoices, users do **not** manually type client details.
- Use the unified `<ClientSnapshotCard />` and `<ClientCombobox />` to search and auto-fetch verified corporate client metadata (GSTIN, company, email, phone, billing address).
- Allow on-the-fly registration using the embedded `+ Add New Client` modal only.

### 3. Accounting & Deliverables Ledger
- All document creator forms must use `<DocumentItemsTable />`.
- Every line item must display:
  - Title & Scope description
  - Connected Quantity & Unit picker (`hrs`, `days`, `units`, `mile`, `mos`)
  - Right-aligned Unit Rate
  - Taxable Turnover
  - Per-item GST breakdown badge (`+₹X.XX (18% GST)`)
  - Gross line total

### 4. Build & Type Safety
- Always run `./node_modules/.bin/tsc --noEmit` in `frontend/` before pushing commits.
- Ensure 0 TypeScript errors.

