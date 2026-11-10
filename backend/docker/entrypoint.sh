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

# Run database migrations and seeders if enabled
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running Database Migrations..."
    php artisan migrate --force --isolated
fi

if [ "$RUN_SEEDERS" = "true" ]; then
    echo "Running Database Seeders..."
    php artisan db:seed --force
fi

# Optimize Laravel for high-performance production
echo "Caching Laravel configuration and routes..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Starting Web and Application Daemons (Nginx + PHP-FPM)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

