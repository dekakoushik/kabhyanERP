# Kabhyan ERP - Architecture & System Specifications

## 1. Project Overview
- **Organization**: Kabhyan (IT Solutions & Services Company)
- **Product**: KabhyanERP
- **Architecture**: Decoupled Monorepo
  - **Backend**: Laravel 11/12 (PHP 8.3+) RESTful API with Sanctum / Bearer Tokens & Redis Caching/Queue
  - **Frontend**: Next.js 14/15 (App Router, TypeScript, Tailwind CSS, Lucide Icons)
  - **Database**: MariaDB / MySQL (`kabhyan_erp`) on port 3306
  - **Cache & Session Management**: Redis (Port 6379, Predis client)
  - **Documentation & Agent Brain**: `.agent/` folder containing architecture, schema, API contracts, task progress, and migration guides.

---

## 2. Design System & UI Principles
- **Theme**: Clean Corporate Light Theme (Not dark theme).
- **Brand Palette**:
  - Primary: Deep Executive Navy / Corporate Slate (`#0f172a`, `#1e3a8a`, `#2563eb`)
  - Secondary: Sky / Indigo Accents (`#3b82f6`, `#6366f1`)
  - Neutral / Backgrounds: Soft Off-White / Pearl Grey (`#f8fafc`, `#f1f5f9`, `#ffffff`)
  - Status Indicators: Emerald Green (Active/Success), Amber (Pending), Crimson (Inactive/Danger)
- **Responsive & Mobile Friendly**:
  - Collapsible responsive sidebar with mobile backdrop drawer.
  - Fluid data tables with card-view fallback on narrow screens.
  - Touch-friendly action buttons and high-contrast readable typography (Inter / Plus Jakarta Sans).

---

## 3. Module Roadmap
1. **Module 1 (Current Focus)**:
   - SuperAdmin Authentication (Sanctum, rate limiting, audit logging).
   - User Management (CRUD, Role assignment: SuperAdmin, Admin, HR, Manager, Employee, Client).
   - Corporate Dashboard Shell with metric cards and responsive navigation.
2. **Module 2**: Organization & Department Management (Designations, Offices, Branches).
3. **Module 3**: HR & Employee Lifecycle (Onboarding, Profiles, Documents, Attendance).
4. **Module 4**: Project & Task Management (Milestones, Task tracking, Sprints).
5. **Module 5**: Client & CRM (Lead generation, Accounts, Quotations).
6. **Module 6**: Financial & Invoicing (Billing, Expenses, Payroll).

---

## 4. Current Status
- Database `kabhyan_erp` initialized.
- Redis server active on port 6379.
- Scaffolding backend and frontend underway.

