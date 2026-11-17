<?php

namespace App\Providers;

use App\Models\SystemSetting;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Enable strict model mode outside of production (prevents lazy loading & unfillable mutations)
        Model::shouldBeStrict(! App::isProduction());

        // Enforce Indian Standard Time (IST - Asia/Kolkata) as universal default
        try {
            $configuredTimezone = config('app.timezone', 'Asia/Kolkata');
            if (class_exists(SystemSetting::class) && Schema::hasTable('system_settings')) {
                $dbTimezone = SystemSetting::get('time_zone', $configuredTimezone);
                if (!empty($dbTimezone)) {
                    $configuredTimezone = $dbTimezone;
                }
            }
            date_default_timezone_set($configuredTimezone);
            Config::set('app.timezone', $configuredTimezone);
        } catch (\Throwable $e) {
            date_default_timezone_set('Asia/Kolkata');
            Config::set('app.timezone', 'Asia/Kolkata');
        }

        // Auto-run pending migrations and auto-heal schema constraints seamlessly without manual CLI commands
        try {
            if (Schema::hasTable('migrations')) {
                // 1. Instantly drop PostgreSQL status check constraint if present
                if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
                    try {
                        \Illuminate\Support\Facades\DB::statement('ALTER TABLE proforma_invoices DROP CONSTRAINT IF EXISTS proforma_invoices_status_check');
                    } catch (\Throwable $e) {
                        // Safe ignore
                    }
                }

                // 2. Auto-run pending database migrations (debounced every 5 minutes to keep requests fast)
                $cacheKey = 'kabhyan_auto_migration_last_run_v4';
                if (!\Illuminate\Support\Facades\Cache::has($cacheKey)) {
                    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                    try {
                        \Illuminate\Support\Facades\Artisan::call('route:clear');
                    } catch (\Throwable $t) {
                        // Safe ignore
                    }
                    \Illuminate\Support\Facades\Cache::put($cacheKey, now()->toIso8601String(), 300);
                }

                // 3. Autonomous route cache refresher for HRMS endpoints
                $routeVersionKey = 'kabhyan_route_cache_v3_hrms_payroll_endpoints';
                if (!\Illuminate\Support\Facades\Cache::has($routeVersionKey)) {
                    try {
                        \Illuminate\Support\Facades\Artisan::call('route:clear');
                        \Illuminate\Support\Facades\Cache::forever($routeVersionKey, true);
                    } catch (\Throwable $e) {
                        // Safe ignore
                    }
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Automatic migration check: ' . $e->getMessage());
        }
    }
}
