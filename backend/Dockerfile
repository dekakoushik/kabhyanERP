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

# Stage 2: Official Standard PHP 8.3 Apache Image
FROM php:8.3-apache AS runner

# Install PostgreSQL client and required PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    curl \
    postgresql-client \
    && docker-php-ext-install pdo_pgsql bcmath pcntl opcache gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Point Apache DocumentRoot to Laravel's public/ directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Enable Apache rewrite module for Laravel routing and suppress ServerName warning
RUN a2enmod rewrite \
    && echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Production PHP Tuning
RUN { \
        echo 'memory_limit = 512M'; \
        echo 'upload_max_filesize = 64M'; \
        echo 'post_max_size = 64M'; \
        echo 'expose_php = Off'; \
    } > /usr/local/etc/php/conf.d/custom.ini

WORKDIR /var/www/html

# Copy source code and vendor dependencies
COPY . /var/www/html
COPY --from=vendor /app/vendor /var/www/html/vendor

# Permissions and Entrypoint
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod +x /var/www/html/docker-entrypoint.sh

EXPOSE 80

# Run entrypoint script for automated migrations, seeding, optimization and startup
ENTRYPOINT ["/var/www/html/docker-entrypoint.sh"]
