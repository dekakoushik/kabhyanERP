# Kabhyan ERP & Kabhyan Connect

[![Kabhyan Technologies](https://img.shields.io/badge/Enterprise-Kabhyan%20Technologies-1B43FF.svg)](https://kabhyan.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.0%20App%20Router-black.svg?logo=next.js)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev)
[![Laravel 12](https://img.shields.io/badge/Laravel-12.x-FF2D20.svg?logo=laravel)](https://laravel.com)
[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?logo=expo)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%206.x-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4.svg?logo=php)](https://php.net)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

Enterprise Enterprise Resource Planning (ERP) platform and companion client mobile ecosystem engineered for **Kabhyan Technologies Private Limited**. The suite powers real-time client collaboration, Indian GST statutory accounting compliance (CGST Rule 50), contract execution, payment gateway reconciliation, engineering milestone tracking, and priority customer support.

---

## 🏛️ System Architecture

The monorepo contains three primary architectural sub-systems:

```
erp.kabhyan.com/
├── backend/                  # Laravel 12 Sanctum REST API & Reverb WebSockets
│   ├── app/                  # Controllers, Models, Observers, Policies, Services
│   ├── database/             # Migrations, Seeders, Factories
│   ├── routes/               # API, Web, Console, and Realtime Broadcasting routes
│   └── docker-entrypoint.sh  # Automated migration, seeding & boot orchestration
│
├── frontend/                 # Next.js 15 (React 19) Enterprise Web Dashboard
│   ├── src/app/              # Next.js App Router (Dedicated CRUD Pages)
│   ├── src/components/       # UI Components, Ledgers, Data Tables, Forms
│   ├── src/lib/              # API Client, Cashfree SDK, State Management, Echo
│   └── public/               # Static assets & brand media
│
└── client-app/               # Kabhyan Connect (Expo SDK 57 / React Native)
    ├── src/screens/          # Dashboard, Billing, Projects, Tickets, Profile
    ├── src/api/              # RESTful API connector with SecureStore persistence
    ├── src/utils/            # Echo / Reverb real-time websocket listener
    ├── assets/               # Splash screens, adaptive icons, and branding
    └── playstore-assets/     # Google Play Store listing graphics (1024x500, 1080x1935)
```

---

## ✨ Core Features & Capabilities

### 1. Statutory GST Accounting & Financial Ledgers
- **Full GST Lifecycle**: Quotations / Estimates $\rightarrow$ Proforma Invoices $\rightarrow$ Tax Invoices $\rightarrow$ GST Receipt Vouchers (CGST Rule 50) $\rightarrow$ Refund Vouchers.
- **Automated Tax Breakdown**: Dynamic calculation of CGST (9%), SGST (9%), or IGST (18%) with statutory HSN/SAC categorization.
- **Statutory Receipt Vouchers**: Advance payment receipts with automatic table 11A/11B reporting support, unadjusted advance balance tracking, and invoice linkage safeguards.
- **Accounting & Deliverables Ledger**: Detailed line items showing scope description, connected unit picker (`hrs`, `days`, `units`, `mile`, `mos`), taxable turnover, GST badges, and gross totals.

### 2. Client Portal & Governance Isolation
- **Role Isolation**: Strict separation between internal staff roles (`super_admin`, `admin`, `accountant`, `project_manager`) and external client accounts (`client`). External client profiles never leak into internal team management or permissions builders.
- **Client Auto-Fetch Standard**: Automatic lookup and hydration of verified client metadata (GSTIN, legal entity name, billing address, contact points) with in-place new client registration.

### 3. Kabhyan Connect (Android & iOS Mobile Companion)
- **Production Android App Bundle**: Optimized `.aab` compiled via EAS (Expo Application Services) targeting Android 16 (API 36).
- **Screenshot Shield**: Hardened privacy barrier utilizing native `FLAG_SECURE` (`expo-screen-capture`) preventing screenshots and screen recordings of sensitive financial invoices and tickets.
- **Cashfree PG Integration**: One-touch online invoice payment checkout directly within the app using `expo-web-browser`.
- **Ticketing & Media Attachments**: Real-time customer support desk with threaded conversations and device image attachments.

### 4. Real-Time Communication & WebSockets
- **Laravel Reverb**: First-party WebSocket broadcasting engine running on `ws.erp.kabhyan.com:443`.
- **Instant Event Propagation**: Live notification badges, ticket reply streaming, project milestone updates, and invoice payment settlements without polling.

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **PHP**: `^8.2` with `pdo_mysql`, `pdo_pgsql`, `mbstring`, `bcmath`, `curl` extensions
- **Node.js**: `^20.x` or `^22.x`
- **Composer**: `^2.x`
- **Database**: PostgreSQL `^15` or MySQL `^8.0`

---

### 1. Backend Setup (Laravel 12)

```bash
cd backend

# Install dependencies
composer install

# Environment configuration
cp .env.example .env
php artisan key:generate

# Configure database credentials in .env, then run self-healing migrations & seeders
php artisan migrate --seed

# Start the Laravel REST API server
php artisan serve --port=8000

# Start Reverb WebSockets (in a separate terminal)
php artisan reverb:start
```

---

### 2. Frontend Setup (Next.js 15)

```bash
cd frontend

# Install dependencies
npm install

# Environment configuration
# Ensure NEXT_PUBLIC_API_URL points to your backend (e.g. http://localhost:8000/api/v1)

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the enterprise dashboard.

---

### 3. Mobile Client App Setup (Kabhyan Connect)

```bash
cd client-app

# Install dependencies
npm install

# Start Expo development server
npx expo start -c
```

- **Android**: Scan terminal QR code with **Expo Go** or press `a` for Android Emulator.
- **iOS**: Scan terminal QR code with camera app to open in **Expo Go**.

---

## 🏗️ Production Builds & Deployment

### Automated Zero-Manual-Command Deployments
The backend container runs `backend/docker-entrypoint.sh`, which automatically:
1. Waits for database network readiness.
2. Executes pending database migrations safely (`php artisan migrate --force`).
3. Re-caches route, view, and config trees.
4. Boots `php-fpm` and background queue workers.

### Frontend Production Build
```bash
cd frontend
npm run build
npm run start
```

### Mobile Production Release (.aab for Google Play Store)
```bash
cd client-app
# Verify type safety
npx tsc --noEmit

# Trigger production EAS cloud build
eas build --platform android --profile production
```

---

## 🔒 Code Standards & Architectural Rules

- **Dedicated Page Architecture**: Entity creation and editing always uses full-page routes (`/dashboard/{resource}/create` and `/dashboard/{resource}/[id]/edit`), never modal dialogs.
- **Pretty URLs**: Zero query-string routing for record targeting or creation.
- **Type Safety**: Strictly zero TypeScript errors across `frontend/` and `client-app/`.
- **Copywriting Standard**: Professional, action-oriented, human-friendly labels without bureaucratic or developer jargon.

---

## 📄 License & Ownership

Copyright © 2026 **Kabhyan Technologies Private Limited**. All rights reserved.  
Proprietary software. Unauthorized copying, distribution, or reproduction of this codebase, via any medium, is strictly prohibited.
