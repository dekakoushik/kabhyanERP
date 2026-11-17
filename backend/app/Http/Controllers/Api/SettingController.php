<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\DocumentNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

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

        // Check PostgreSQL Database status & latency
        $dbStatus = 'connected';
        $dbPing = '0 ms';
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $dbPing = round((microtime(true) - $start) * 1000, 2) . ' ms';
        } catch (\Throwable $e) {
            $dbStatus = 'disconnected: ' . $e->getMessage();
            $dbPing = 'ERR';
        }

        // System Health / Environment (Pure Laravel + PostgreSQL)
        $environment = [
            'app_name' => config('app.name'),
            'app_env' => config('app.env'),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'database_status' => $dbStatus,
            'database_ping' => $dbPing,
            'database_driver' => config('database.default'),
            'redis_status' => 'disabled',
            'redis_ping' => 'N/A',
            'cache_driver' => config('cache.default'),
            'queue_driver' => config('queue.default'),
            'session_driver' => config('session.driver'),
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
     * Flush application cache.
     */
    public function flushCache(Request $request)
    {
        try {
            Cache::flush();
            Artisan::call('cache:clear');
            return response()->json(['message' => 'Application cache cleared successfully.']);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Cache cleared (partial): ' . $e->getMessage()]);
        }
    }

    /**
     * Run pending database migrations and clear schema caches.
     */
    public function migrateDatabase(Request $request): JsonResponse
    {
        try {
            // Drop PostgreSQL check constraint if lingering
            if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
                try {
                    \Illuminate\Support\Facades\DB::statement('ALTER TABLE proforma_invoices DROP CONSTRAINT IF EXISTS proforma_invoices_status_check');
                } catch (\Throwable $e) {}
            }

            Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = Artisan::output();

            Artisan::call('db:seed', ['--class' => 'RoleAndPermissionSeeder', '--force' => true]);
            $seedOutput = Artisan::output();

            Artisan::call('optimize:clear');

            return response()->json([
                'message' => 'Database migrations and schema synchronization executed successfully.',
                'migrate_output' => trim($migrateOutput),
                'seed_output' => trim($seedOutput),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Database migration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Factory database reset: Purges all commercial, client, project, task,
     * ticket, expense, HRMS, and non-admin staff records, resetting counters to 001.
     * Strictly preserves the currently authenticated SuperAdmin.
     */
    public function resetDatabase(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. SuperAdmin authorization guard
        if (! $user || ! $user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Unauthorized. Only Super Administrators can perform a database reset.',
            ], 403);
        }

        // 2. Validate confirmation phrase and current password
        $validated = $request->validate([
            'confirmation' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (trim($validated['confirmation']) !== 'RESET DATABASE') {
            throw ValidationException::withMessages([
                'confirmation' => ['You must type "RESET DATABASE" exactly to authorize this operation.'],
            ]);
        }

        if (! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The password you entered is incorrect.'],
            ]);
        }

        // 3. Execute atomic factory reset
        try {
            DB::beginTransaction();

            // Purge Commercial Billing Ledger
            if (Schema::hasTable('invoice_payments')) {
                DB::table('invoice_payments')->delete();
            }
            if (Schema::hasTable('invoice_items')) {
                DB::table('invoice_items')->delete();
            }
            if (Schema::hasTable('invoices')) {
                DB::table('invoices')->delete();
            }
            if (Schema::hasTable('proforma_invoice_items')) {
                DB::table('proforma_invoice_items')->delete();
            }
            if (Schema::hasTable('proforma_invoices')) {
                DB::table('proforma_invoices')->delete();
            }
            if (Schema::hasTable('estimate_items')) {
                DB::table('estimate_items')->delete();
            }
            if (Schema::hasTable('estimates')) {
                DB::table('estimates')->delete();
            }

            // Purge Projects, Tasks, and Members
            if (Schema::hasTable('tasks')) {
                DB::table('tasks')->delete();
            }
            if (Schema::hasTable('project_members')) {
                DB::table('project_members')->delete();
            }
            if (Schema::hasTable('projects')) {
                DB::table('projects')->delete();
            }

            // Purge Support Tickets & Conversations
            if (Schema::hasTable('ticket_replies')) {
                DB::table('ticket_replies')->delete();
            }
            if (Schema::hasTable('tickets')) {
                DB::table('tickets')->delete();
            }

            // Purge CRM Clients Directory
            if (Schema::hasTable('clients')) {
                DB::table('clients')->delete();
            }

            // Purge Organizational Expenses Ledger
            if (Schema::hasTable('expenses')) {
                DB::table('expenses')->delete();
            }

            // Purge HRMS, Attendances & Payroll
            if (Schema::hasTable('payslips')) {
                DB::table('payslips')->delete();
            }
            if (Schema::hasTable('payroll_batches')) {
                DB::table('payroll_batches')->delete();
            }
            if (Schema::hasTable('salary_structures')) {
                DB::table('salary_structures')->delete();
            }
            if (Schema::hasTable('leave_requests')) {
                DB::table('leave_requests')->delete();
            }
            if (Schema::hasTable('daily_attendances')) {
                DB::table('daily_attendances')->delete();
            }
            if (Schema::hasTable('monthly_attendances')) {
                DB::table('monthly_attendances')->delete();
            }

            // Purge System Notifications
            if (Schema::hasTable('system_notifications')) {
                DB::table('system_notifications')->delete();
            }

            // Purge other users' sessions (keep current user's active session)
            if (Schema::hasTable('personal_access_tokens')) {
                DB::table('personal_access_tokens')
                    ->where('tokenable_id', '!=', $user->id)
                    ->delete();
            }

            // Purge all users except the current authenticated SuperAdmin
            if (Schema::hasTable('users')) {
                DB::table('users')
                    ->where('id', '!=', $user->id)
                    ->where('role', '!=', 'superadmin')
                    ->delete();
            }

            // Reset Document Numbering Sequences in System Settings to 1
            if (Schema::hasTable('system_settings')) {
                $counters = [
                    'estimate_next_number' => 1,
                    'proforma_next_number' => 1,
                    'invoice_next_number' => 1,
                    'client_next_number' => 1,
                    'expense_next_number' => 1,
                ];

                foreach ($counters as $key => $val) {
                    DB::table('system_settings')->updateOrInsert(
                        ['key' => $key],
                        [
                            'value' => (string) $val,
                            'group' => 'document_numbering',
                            'type' => 'integer',
                            'updated_at' => now(),
                        ]
                    );
                }

                DB::table('system_settings')->updateOrInsert(
                    ['key' => 'last_database_reset_at'],
                    [
                        'value' => now()->toIso8601String(),
                        'group' => 'system_lifecycle',
                        'type' => 'string',
                        'description' => 'Timestamp of last manual factory database reset',
                        'updated_at' => now(),
                    ]
                );
            }

            // Reset PostgreSQL auto-increment sequences
            if (DB::getDriverName() === 'pgsql') {
                $tables = [
                    'clients', 'projects', 'tasks', 'estimates', 'estimate_items',
                    'proforma_invoices', 'proforma_invoice_items', 'invoices',
                    'invoice_items', 'invoice_payments', 'expenses', 'tickets',
                    'ticket_replies', 'daily_attendances', 'monthly_attendances',
                    'leave_requests', 'salary_structures', 'payroll_batches',
                    'payslips', 'system_notifications',
                ];

                foreach ($tables as $t) {
                    try {
                        DB::statement("ALTER SEQUENCE IF EXISTS {$t}_id_seq RESTART WITH 1");
                    } catch (\Throwable $seqE) {
                        // Safe ignore
                    }
                }
            }

            DB::commit();

            // Clear application caches
            Cache::flush();
            Artisan::call('cache:clear');
            Artisan::call('optimize:clear');

            return response()->json([
                'message' => 'Factory database reset completed successfully. All records have been cleared and counters reset to 001.',
                'reset_at' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to reset database: ' . $e->getMessage(),
            ], 500);
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

    /**
     * Upload specialized corporate brand logo asset.
     */
    public function uploadBrandAsset(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:logo_primary,logo_document,logo_icon,logo_dark',
            'file' => 'required|file|mimes:png,jpg,jpeg,webp|max:3072',
        ]);

        $file = $request->file('file');
        $type = $validated['type'];

        // Determine destination folder inside public storage
        $destinationPath = public_path('storage/brand');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0775, true);
        }

        $extension = $file->getClientOriginalExtension();
        $filename = "{$type}_" . time() . ".{$extension}";

        $file->move($destinationPath, $filename);
        $publicUrl = "/storage/brand/{$filename}";

        // Save into SystemSetting
        $settingKey = "company_{$type}";
        SystemSetting::set($settingKey, $publicUrl, 'company');

        return response()->json([
            'message' => 'Brand asset uploaded successfully',
            'key' => $settingKey,
            'url' => $publicUrl,
        ]);
    }

    /**
     * Delete or reset a brand asset to default.
     */
    public function deleteBrandAsset(string $type)
    {
        if (!in_array($type, ['logo_primary', 'logo_document', 'logo_icon', 'logo_dark'])) {
            return response()->json(['message' => 'Invalid brand asset type'], 422);
        }

        $settingKey = "company_{$type}";
        $current = SystemSetting::get($settingKey);

        if ($current && str_starts_with($current, '/storage/brand/')) {
            $filePath = public_path(ltrim($current, '/'));
            if (file_exists($filePath)) {
                @unlink($filePath);
            }
        }

        SystemSetting::set($settingKey, '', 'company');

        return response()->json([
            'message' => 'Brand asset reset to default',
            'key' => $settingKey,
        ]);
    }

    /**
     * Get preview of next document numbers.
     */
    public function nextDocumentNumbers(Request $request)
    {
        $overrides = $request->only([
            'estimate_prefix', 'estimate_suffix', 'estimate_padding', 'estimate_include_year', 'estimate_next_number',
            'proforma_prefix', 'proforma_suffix', 'proforma_padding', 'proforma_include_year', 'proforma_next_number',
            'invoice_prefix', 'invoice_suffix', 'invoice_padding', 'invoice_include_year', 'invoice_next_number',
        ]);

        return response()->json([
            'numbers' => DocumentNumberService::previewAll(!empty($overrides) ? $overrides : null),
        ]);
    }
}

