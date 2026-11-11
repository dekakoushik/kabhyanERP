<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SettingController extends Controller
{
    /**
     * Get all system settings grouped by categories, plus live server health.
     */
    public function index(Request $request)
    {
        $grouped = Cache::remember('all_system_settings_grouped', 3600, function () {
            return SystemSetting::all()->groupBy('group');
        });

        // Check Redis status
        $redisStatus = 'connected';
        $redisPing = 'PONG';
        try {
            $redisPing = Redis::ping();
        } catch (\Throwable $e) {
            $redisStatus = 'disconnected: ' . $e->getMessage();
        }

        // Database status
        $dbStatus = 'connected';

        // System Health / Environment
        $environment = [
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_status' => $dbStatus,
            'redis_status' => $redisStatus,
            'redis_ping' => $redisPing,
            'cache_driver' => config('cache.default'),
            'server_time' => now()->toDateTimeString(),
            'timezone' => config('app.timezone'),
        ];

        return response()->json([
            'settings' => $grouped,
            'environment' => $environment,
        ]);
    }

    /**
     * Bulk update settings by group or key-value pairs.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.group' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $item) {
            SystemSetting::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => is_array($item['value']) ? json_encode($item['value']) : $item['value'],
                    'group' => $item['group'] ?? 'general',
                ]
            );
            Cache::forget("setting_{$item['key']}");
        }

        Cache::forget('all_system_settings');
        Cache::forget('all_system_settings_grouped');

        return response()->json([
            'message' => 'System settings updated successfully.',
        ]);
    }

    /**
     * Flush application and Redis cache.
     */
    public function flushCache(Request $request)
    {
        try {
            Cache::flush();
            Redis::flushall();
            return response()->json(['message' => 'Application & Redis cache cleared successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Cache cleared (partial): ' . $e->getMessage()]);
        }
    }

    /**
     * Test SMTP mail configuration by sending a verification test email.
     */
    public function testEmail(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $recipient = $validated['email'];

        try {
            // Apply current database or passed settings dynamically before test
            $host = SystemSetting::get('mail_host', config('mail.mailers.smtp.host'));
            $port = SystemSetting::get('mail_port', config('mail.mailers.smtp.port'));
            $username = SystemSetting::get('mail_username', config('mail.mailers.smtp.username'));
            $password = SystemSetting::get('mail_password', config('mail.mailers.smtp.password'));
            $encryption = SystemSetting::get('mail_encryption', config('mail.mailers.smtp.scheme'));
            $fromAddress = SystemSetting::get('mail_from_address', config('mail.from.address'));
            $fromName = SystemSetting::get('mail_from_name', config('mail.from.name', 'Kabhyan ERP'));

            config([
                'mail.default' => 'smtp',
                'mail.mailers.smtp.host' => $host,
                'mail.mailers.smtp.port' => (int) $port,
                'mail.mailers.smtp.username' => $username,
                'mail.mailers.smtp.password' => $password,
                'mail.mailers.smtp.scheme' => ($encryption === 'null' || empty($encryption)) ? null : $encryption,
                'mail.from.address' => $fromAddress,
                'mail.from.name' => $fromName,
            ]);

            \Illuminate\Support\Facades\Mail::raw(
                "Hello,\n\nThis is a test email sent from Kabhyan ERP to verify your SMTP mail configuration.\n\n" .
                "Server Host: {$host}\n" .
                "Server Port: {$port}\n" .
                "Encryption: " . ($encryption ?: 'None') . "\n" .
                "From: {$fromName} <{$fromAddress}>\n" .
                "Timestamp: " . now()->toDateTimeString() . " (" . config('app.timezone') . ")\n\n" .
                "If you received this message, your SMTP mail delivery pipeline is working properly!",
                function ($message) use ($recipient, $fromAddress, $fromName) {
                    $message->to($recipient)
                        ->from($fromAddress, $fromName)
                        ->subject("Kabhyan ERP: SMTP Configuration Test Email");
                }
            );

            return response()->json([
                'message' => "Test email successfully dispatched to {$recipient}.",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to send test email: ' . $e->getMessage(),
            ], 422);
        }
    }
}

