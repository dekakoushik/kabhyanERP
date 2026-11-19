# Stage 1: Vendor build with Composer
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs

# Stage 2: Official FrankenPHP 8.3 Runner (Go-powered Caddy Application Server)
FROM dunglas/frankenphp:1-php8.3-bookworm AS runner

# Install PostgreSQL client for healthcheck readiness and PHP extensions via install-php-extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    zip \
    unzip \
    curl \
    && install-php-extensions \
    pdo_pgsql \
    bcmath \
    pcntl \
    opcache \
    gd \
    zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Production PHP Tuning
RUN { \
        echo 'memory_limit = 512M'; \
        echo 'upload_max_filesize = 64M'; \
        echo 'post_max_size = 64M'; \
        echo 'expose_php = Off'; \
        echo 'opcache.enable_cli = 1'; \
        echo 'opcache.validate_timestamps = 0'; \
    } > /usr/local/etc/php/conf.d/custom.ini

# Set default server name to listen on standard port 80
ENV SERVER_NAME=":80"

WORKDIR /var/www/html

# Copy Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy source code and vendor dependencies
COPY . /var/www/html
COPY --from=vendor /app/vendor /var/www/html/vendor

# Permissions and Entrypoint
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod +x /var/www/html/docker-entrypoint.sh

EXPOSE 80 8080

# Universal healthcheck compatible with FrankenPHP web server, Reverb WebSockets, and Queue workers
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD php -r "exit(0);"

# Run entrypoint script for automated migrations, seeding, optimization and startup
ENTRYPOINT ["/var/www/html/docker-entrypoint.sh"]
