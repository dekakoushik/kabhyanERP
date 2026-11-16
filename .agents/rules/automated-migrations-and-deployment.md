---
name: automated-migrations-and-deployment
description: Enforce zero-manual-command deployments with self-healing database schemas, automated startup entrypoints, and autonomous migrations.
---

# Automated Migrations & Self-Healing Schemas

## 1. Core Principle: Zero-Manual-Command Deployments
Deployments, container restarts, and database updates must run automatically. Developers and administrators should never be required to manually SSH into the server to execute `php artisan migrate`, `config:clear`, or schema patches.

---

## 2. The 3 Automation Layers

### Layer 1: Application-Level Self-Healing (`AppServiceProvider.php`)
* On boot, Laravel checks for schema compatibility:
  - Automatically executes pending migrations via `Artisan::call('migrate', ['--force' => true])` (debounced with a lightweight cache lock so response times remain instantaneous).
  - Automatically drops lingering PostgreSQL enum check constraints (e.g. `proforma_invoices_status_check`) without requiring a manual SQL script.

### Layer 2: Automated Docker Startup (`docker-entrypoint.sh`)
* All Docker containers must use an entrypoint script rather than fragile inline `CMD` chains:
  1. Polls `pg_isready` until the database service accepts connections.
  2. Runs `php artisan storage:link --force`.
  3. Executes `php artisan migrate --force`.
  4. Runs idempotent seeders (`RoleAndPermissionSeeder`).
  5. Clears old caches (`optimize:clear`) and builds fresh config/route caches (`config:cache`, `route:cache`).
  6. Starts the web server (`apache2-foreground`).

### Layer 3: Remote Admin API Endpoint
* The application exposes `POST /api/v1/settings/migrate-database` (guarded by Admin / SuperAdmin privileges) to allow triggering full database migrations and cache flushes from the web interface without touching the terminal.

---

## 3. Checklist for Any Schema or Infrastructure Change
- [ ] Database migrations are backwards-compatible and non-destructive.
- [ ] Seeders are 100% idempotent using `updateOrCreate` or `firstOrCreate`.
- [ ] Docker configuration uses `docker-entrypoint.sh` with LF line endings.
- [ ] No manual terminal command is required to make the live application functional after git pull / deploy.
