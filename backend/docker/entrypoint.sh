#!/bin/sh
set -e

echo "==> Bootstrapping Kabhyan ERP Backend via Laravel Artisan..."

# 1. Ensure storage directories exist with write permissions
mkdir -p /var/www/html/storage/app/public/brand \
         /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

# 2. Ensure Laravel public storage symlink exists
php artisan storage:link || true

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/public/storage
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# 3. If APP_KEY is missing or empty, generate one
if [ -z "$APP_KEY" ]; then
    echo "Generating Application Key..."
    php artisan key:generate --force
fi

# 4. Wait for PostgreSQL to be ready before running migrations
if [ -n "$DB_HOST" ] && [ "$DB_CONNECTION" = "pgsql" ]; then
    echo "Checking database connection to $DB_HOST:$DB_PORT..."
    MAX_TRIES=30
    TRIES=0
    until php -r "try { new PDO('pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); exit(0); } catch (Throwable \$e) { exit(1); }" 2>/dev/null; do
        TRIES=$((TRIES+1))
        if [ $TRIES -ge $MAX_TRIES ]; then
            echo "Warning: Database not reachable after $MAX_TRIES attempts. Continuing startup..."
            break
        fi
        echo "Waiting for database ($TRIES/$MAX_TRIES)..."
        sleep 2
    done
fi

# 5. Run database migrations and seeders if enabled
if [ "$RUN_MIGRATIONS" = "true" ] || [ -z "$RUN_MIGRATIONS" ]; then
    echo "Running Database Migrations..."
    php artisan migrate --force --isolated || echo "Warning: Migration failed or database not ready yet."
fi

# 6. Ensure default users and system settings exist if not already seeded
if [ "$RUN_SEEDERS" = "true" ] || [ -z "$RUN_SEEDERS" ]; then
    echo "Ensuring SuperAdmin and system settings are seeded..."
    php artisan db:seed --force || echo "Warning: Seeder failed."
fi

# 7. Optimize configuration and routes
echo "Caching Laravel configuration and routes..."
php artisan config:cache || echo "Warning: config:cache failed"
php artisan route:cache || echo "Warning: route:cache failed"

# 8. Start background database queue worker
echo "Starting Laravel Database Queue Worker..."
php artisan queue:work --sleep=3 --tries=3 --max-time=3600 &

# 9. Start Laravel Native Server via Artisan Octane
echo "==> Starting Laravel Octane Server on port 80..."
exec php artisan octane:start --server=frankenphp --host=0.0.0.0 --port=80 --workers=auto
