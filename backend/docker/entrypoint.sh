#!/bin/sh
set -e

echo "==> Bootstrapping Kabhyan ERP Backend..."

# Ensure storage directories exist with write permissions
mkdir -p /var/www/html/storage/framework/cache/data \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# If APP_KEY is missing or empty, generate one
if [ -z "$APP_KEY" ]; then
    echo "Generating Application Key..."
    php artisan key:generate --force
fi

# Wait for PostgreSQL to be ready before running migrations
if [ -n "$DB_HOST" ] && [ "$DB_CONNECTION" = "pgsql" ]; then
    echo "Checking database connection to $DB_HOST:$DB_PORT..."
    MAX_TRIES=30
    TRIES=0
    until php -r "try { new PDO('pgsql:host='.getenv('DB_HOST').';port='.getenv('DB_PORT').';dbname='.getenv('DB_DATABASE'), getenv('DB_USERNAME'), getenv('DB_PASSWORD')); exit(0); } catch (Throwable \$e) { exit(1); }" 2>/dev/null; do
        TRIES=$((TRIES+1))
        if [ $TRIES -ge $MAX_TRIES ]; then
            echo "Warning: Database not reachable after $MAX_TRIES attempts. Continuing startup so container does not crash..."
            break
        fi
        echo "Waiting for database ($TRIES/$MAX_TRIES)..."
        sleep 2
    done
fi

# Run database migrations and seeders if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running Database Migrations..."
    php artisan migrate --force --isolated || echo "Warning: Migration failed or database not ready yet."
fi

# Ensure default users and system settings exist if not already seeded
if [ "$RUN_SEEDERS" = "true" ] || [ -z "$RUN_SEEDERS" ]; then
    echo "Ensuring SuperAdmin and system settings are seeded..."
    php artisan db:seed --force || echo "Warning: Seeder failed."
fi

# Optimize Laravel for high-performance production
echo "Caching Laravel configuration and routes..."
php artisan config:cache || echo "Warning: config:cache failed"
php artisan route:cache || echo "Warning: route:cache failed"
php artisan view:cache || echo "Warning: view:cache failed"

echo "==> Starting Web and Application Daemons (Nginx + PHP-FPM)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

