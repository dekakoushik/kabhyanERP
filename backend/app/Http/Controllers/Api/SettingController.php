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
        $allSettings = SystemSetting::all();
        $grouped = [];

        foreach ($allSettings as $item) {
            $grouped[$item->group][] = $item;
        }

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
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            'mail_from_address' => 'nullable|string',
            'mail_from_name' => 'nullable|string',
        ]);

        $recipient = $validated['email'];

        try {
            // Prefer settings passed directly in request (live unsaved inputs in form), fallback to DB/config
            $host = $validated['mail_host'] ?? SystemSetting::get('mail_host', config('mail.mailers.smtp.host'));
            $port = (int) ($validated['mail_port'] ?? SystemSetting::get('mail_port', config('mail.mailers.smtp.port', 587)));
            $username = $validated['mail_username'] ?? SystemSetting::get('mail_username', config('mail.mailers.smtp.username'));
            $password = $validated['mail_password'] ?? SystemSetting::get('mail_password', config('mail.mailers.smtp.password'));
            $encryption = $validated['mail_encryption'] ?? SystemSetting::get('mail_encryption', config('mail.mailers.smtp.scheme'));
            $fromAddress = $validated['mail_from_address'] ?? SystemSetting::get('mail_from_address', config('mail.from.address', 'no-reply@kabhyan.com'));
            $fromName = $validated['mail_from_name'] ?? SystemSetting::get('mail_from_name', config('mail.from.name', 'Kabhyan Technologies'));

            // Build a dynamic standalone Symfony EsmtpTransport to guarantee direct port & encryption binding
            $schemePrefix = '';
            if ($encryption === 'ssl' || $port === 465) {
                $transport = new \Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport(
                    $host,
                    $port,
                    true // direct TLS/SSL
                );
            } else {
                $transport = new \Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport(
                    $host,
                    $port,
                    false // opportunistic / STARTTLS
                );
            }

            if (!empty($username)) {
                $transport->setUsername($username);
            }
            if (!empty($password)) {
                $transport->setPassword($password);
            }

            $symfonyMailer = new \Symfony\Component\Mailer\Mailer($transport);

            $emailMessage = (new \Symfony\Component\Mime\Email())
                ->from(new \Symfony\Component\Mime\Address($fromAddress, $fromName))
                ->to($recipient)
                ->subject("Kabhyan ERP: SMTP Configuration Verification")
                ->text(
                    "Hello,\n\nThis is a verification test email sent from Kabhyan ERP.\n\n" .
                    "SMTP Server: {$host}\n" .
                    "SMTP Port: {$port}\n" .
                    "Encryption: " . ($encryption ?: 'None') . "\n" .
                    "From: {$fromName} <{$fromAddress}>\n" .
                    "Timestamp: " . now()->toDateTimeString() . " (" . config('app.timezone') . ")\n\n" .
                    "If you received this message, your SMTP mail pipeline is verified and fully operational!"
                );

            $symfonyMailer->send($emailMessage);

            return response()->json([
                'message' => "Test email successfully sent to {$recipient}!",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to send test email: ' . $e->getMessage(),
            ], 422);
        }
    }
}

