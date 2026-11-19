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
chmod -R 777 /var/www/html/storage/app/public

# 3. Ensure storage link
php artisan storage:link --force || true

# 3. Auto-run database migrations and seeds (only on primary web backend)
if [ "$CONTAINER_ROLE" != "reverb" ] && [ "$CONTAINER_ROLE" != "queue" ]; then
    echo "[Kabhyan ERP] Auto-running migrations..."
    php artisan migrate --force

    echo "[Kabhyan ERP] Auto-running seeds..."
    php artisan db:seed --force || true
fi

# 4. Clear old and re-cache configs
echo "[Kabhyan ERP] Optimizing configuration..."
php artisan optimize:clear || true
php artisan config:cache || true
php artisan route:cache || true

# 5. Final ownership enforcement so www-data owns all artisan-generated caches & storage
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 777 /var/www/html/storage/app/public

# 6. Service Execution Router (FrankenPHP Web / Laravel Reverb / Queue Worker)
if [ "$CONTAINER_ROLE" = "reverb" ] || [ "$CONTAINER_ROLE" = "websocket" ] || [ "$1" = "reverb" ] || [[ "$*" == *"reverb"* ]]; then
    echo "[Kabhyan ERP] Automated startup complete. Launching Laravel Reverb WebSocket Server on 0.0.0.0:8080..."
    exec php artisan reverb:start --host=0.0.0.0 --port=8080 --hostname="${REVERB_HOST:-ws.erp.kabhyan.com}"
fi

if [ "$CONTAINER_ROLE" = "queue" ] || [ "$1" = "queue" ]; then
    echo "[Kabhyan ERP] Automated startup complete. Launching Queue Worker..."
    exec php artisan queue:work --sleep=3 --tries=3
fi

if [ "$#" -gt 0 ]; then
    exec "$@"
fi

echo "[Kabhyan ERP] Automated startup complete. Launching FrankenPHP..."
exec frankenphp run --config /etc/caddy/Caddyfile
