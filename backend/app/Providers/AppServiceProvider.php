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
            if (Schema::hasTable('system_settings')) {
                $mailMailer = SystemSetting::get('mail_mailer');
                $mailHost = SystemSetting::get('mail_host');
                $mailPort = SystemSetting::get('mail_port');
                $mailUsername = SystemSetting::get('mail_username');
                $mailPassword = SystemSetting::get('mail_password');
                $mailEncryption = SystemSetting::get('mail_encryption');
                $mailFromAddress = SystemSetting::get('mail_from_address');
                $mailFromName = SystemSetting::get('mail_from_name');

                if ($mailMailer) {
                    Config::set('mail.default', $mailMailer);
                }

                if ($mailHost) {
                    Config::set('mail.mailers.smtp.host', $mailHost);
                }
                if ($mailPort) {
                    Config::set('mail.mailers.smtp.port', (int) $mailPort);
                }
                if ($mailUsername) {
                    Config::set('mail.mailers.smtp.username', $mailUsername);
                }
                if ($mailPassword) {
                    Config::set('mail.mailers.smtp.password', $mailPassword);
                }
                if ($mailEncryption) {
                    Config::set('mail.mailers.smtp.scheme', $mailEncryption === 'null' ? null : $mailEncryption);
                }
                if ($mailFromAddress) {
                    Config::set('mail.from.address', $mailFromAddress);
                }
                if ($mailFromName) {
                    Config::set('mail.from.name', $mailFromName);
                }
            }
        } catch (\Throwable $e) {
            // Silently continue if database not yet migrated or connected
        }
    }
}
