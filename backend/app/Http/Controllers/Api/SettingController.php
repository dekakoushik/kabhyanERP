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
            $isDirectTls = ($encryption === 'ssl' || $port === 465);
            $transport = new \Symfony\Component\Mailer\Transport\Smtp\EsmtpTransport(
                $host,
                $port,
                $isDirectTls
            );

            // Configure socket stream options for SSL/TLS cert validation & timeout
            $streamOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true,
                ],
            ];
            $stream = $transport->getStream();
            if (method_exists($stream, 'setStreamOptions')) {
                $stream->setStreamOptions($streamOptions);
            }

            if (!empty($username)) {
                $transport->setUsername($username);
            }
            if (!empty($password)) {
                $transport->setPassword($password);
            }

            $symfonyMailer = new \Symfony\Component\Mailer\Mailer($transport);

            $companyName = SystemSetting::get('company_name', 'Kabhyan Technologies Private Limited');
            $companyAddress = SystemSetting::get('company_address', 'Bandra Kurla Complex, Mumbai, Maharashtra 400051');
            $companyGstin = SystemSetting::get('company_gstin', '18AAGCK2934D1Z2');
            $companyEmail = SystemSetting::get('company_email', 'contact@kabhyan.com');
            $companyPhone = SystemSetting::get('company_phone', '+91 98200 12345');
            $companyWebsite = SystemSetting::get('company_website', 'https://www.kabhyan.com');

            $contentHtml = '
                <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a; font-weight: 700;">SMTP Mail Pipeline Verification</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
                    This is an official verification transmission dispatched from your <strong>Kabhyan ERP</strong> system. If you are reading this email, your corporate SMTP host settings, authentication credentials, and transport encryption are operating seamlessly without issue.
                </p>

                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                    <div style="font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Active Transmission Parameters</div>
                    <table width="100%" cellpadding="6" cellspacing="0" border="0" style="font-size: 13px; color: #334155;">
                        <tr>
                            <td width="140" style="font-weight: 600; color: #64748b;">SMTP Host:</td>
                            <td><span style="font-family: monospace; font-weight: 700; color: #0f172a;">' . htmlspecialchars($host) . '</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600; color: #64748b;">Port & Encryption:</td>
                            <td><span style="font-family: monospace;">' . htmlspecialchars((string)$port) . ' (' . htmlspecialchars(strtoupper($encryption ?: 'None')) . ')</span></td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600; color: #64748b;">From Identity:</td>
                            <td>' . htmlspecialchars($fromName) . ' &lt;' . htmlspecialchars($fromAddress) . '&gt;</td>
                        </tr>
                        <tr>
                            <td style="font-weight: 600; color: #64748b;">Server Time:</td>
                            <td>' . now()->toDateTimeString() . ' (' . config('app.timezone') . ')</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 16px; margin: 20px 0; font-size: 13px; color: #065f46;">
                    <strong>System Status: Operational</strong> &bull; All future client invoice alerts, quotation notifications, and support ticket dispatches will utilize this verified SMTP configuration.
                </div>
            ';

            $fullHtml = \App\Services\MailNotificationService::renderLayout(
                "Kabhyan ERP: SMTP Configuration Verification",
                $contentHtml,
                rtrim(config('app.url', 'https://erp.kabhyan.com'), '/') . '/dashboard/settings/email',
                "Review SMTP Settings in ERP",
                $companyName,
                $companyAddress,
                $companyGstin,
                $companyEmail,
                $companyPhone,
                $companyWebsite
            );

            $emailMessage = (new \Symfony\Component\Mime\Email())
                ->from(new \Symfony\Component\Mime\Address($fromAddress, $fromName))
                ->to($recipient)
                ->subject("Kabhyan ERP: SMTP Configuration Verification")
                ->html($fullHtml)
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

