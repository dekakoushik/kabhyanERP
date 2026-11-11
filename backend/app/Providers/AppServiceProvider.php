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
        // Dynamically override mail configuration from database system settings if present
        try {
            if (!app()->runningInConsole() && Schema::hasTable('system_settings')) {
                $settings = SystemSetting::where('group', 'email_smtp')->pluck('value', 'key');

                if (isset($settings['mail_mailer'])) {
                    Config::set('mail.default', $settings['mail_mailer']);
                }
                if (isset($settings['mail_host'])) {
                    Config::set('mail.mailers.smtp.host', $settings['mail_host']);
                }
                if (isset($settings['mail_port'])) {
                    Config::set('mail.mailers.smtp.port', (int) $settings['mail_port']);
                }
                if (isset($settings['mail_username'])) {
                    Config::set('mail.mailers.smtp.username', $settings['mail_username']);
                }
                if (isset($settings['mail_password'])) {
                    Config::set('mail.mailers.smtp.password', $settings['mail_password']);
                }
                if (isset($settings['mail_encryption'])) {
                    $enc = $settings['mail_encryption'];
                    Config::set('mail.mailers.smtp.scheme', ($enc === 'null' || empty($enc)) ? null : $enc);
                }
                if (isset($settings['mail_from_address'])) {
                    Config::set('mail.from.address', $settings['mail_from_address']);
                }
                if (isset($settings['mail_from_name'])) {
                    Config::set('mail.from.name', $settings['mail_from_name']);
                }
            }
        } catch (\Throwable $e) {
            // Silently continue if database or Redis not yet ready
        }
    }
}
