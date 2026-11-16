#!/bin/bash
set -e

echo "[Kabhyan ERP] Initializing container..."

# 1. Wait for PostgreSQL if DB_HOST is set
if [ -n "$DB_HOST" ]; then
    echo "[Kabhyan ERP] Checking database readiness at $DB_HOST:${DB_PORT:-5432}..."
    for i in {1..30}; do
        if pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-kabhyan_erp_user}" -d "${DB_DATABASE:-kabhyan_erp}" > /dev/null 2>&1; then
            echo "[Kabhyan ERP] Database is ready!"
            break
        fi
        sleep 1
    done
fi

# 2. Ensure storage link
php artisan storage:link --force || true

# 3. Auto-run database migrations with force
echo "[Kabhyan ERP] Auto-running migrations..."
php artisan migrate --force

# 4. Auto-run seeds
echo "[Kabhyan ERP] Auto-running seeds..."
php artisan db:seed --force || true

# 5. Clear old and re-cache configs
echo "[Kabhyan ERP] Optimizing configuration..."
php artisan optimize:clear || true
php artisan config:cache || true
php artisan route:cache || true

echo "[Kabhyan ERP] Automated startup complete. Launching Apache..."
exec apache2-foreground
