<?php

namespace App\Providers;

use App\Models\SystemSetting;
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
    }
}
