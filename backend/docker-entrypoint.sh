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

# 2. Self-Healing Storage Permissions & Directory Structure (Dokploy / Coolify Volume Mounts)
echo "[Kabhyan ERP] Initializing storage directories & permissions..."
mkdir -p /var/www/html/storage/app/public \
         /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 3. Ensure storage link
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

# 6. Final ownership enforcement so www-data owns all artisan-generated caches & storage
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

echo "[Kabhyan ERP] Automated startup complete. Launching Apache..."
exec apache2-foreground
