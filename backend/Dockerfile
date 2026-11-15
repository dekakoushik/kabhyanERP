# Stage 1: Build vendor dependencies with Composer
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

# Stage 2: Production Runtime with FrankenPHP + Laravel Octane
FROM dunglas/frankenphp:1-php8.3-alpine AS runner

# Install PostgreSQL client and required PHP extensions
RUN apk add --no-cache \
    curl \
    postgresql-client \
    && install-php-extensions \
    pdo_pgsql \
    bcmath \
    mbstring \
    pcntl \
    opcache \
    gd \
    zip \
    intl

# Production PHP Tuning
RUN { \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=8'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.revalidate_freq=0'; \
        echo 'opcache.fast_shutdown=1'; \
        echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache-recommended.ini

RUN { \
        echo 'memory_limit = 512M'; \
        echo 'upload_max_filesize = 64M'; \
        echo 'post_max_size = 64M'; \
        echo 'max_execution_time = 300'; \
        echo 'expose_php = Off'; \
    } > /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html

# Copy application source code
COPY . /var/www/html

# Copy vendor dependencies from stage 1
COPY --from=vendor /app/vendor /var/www/html/vendor

# Copy startup script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
