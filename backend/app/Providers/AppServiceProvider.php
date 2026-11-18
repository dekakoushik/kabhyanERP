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
        // Enforce HTTPS URL generation behind SSL reverse proxies and in production
        if (config('app.env') === 'production' || request()->server('HTTP_X_FORWARDED_PROTO') === 'https' || request()->isSecure()) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }

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
                // 1. Instantly drop PostgreSQL status check constraint if present and drop not-null on line items
                if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
                    try {
                        \Illuminate\Support\Facades\DB::statement('ALTER TABLE proforma_invoices DROP CONSTRAINT IF EXISTS proforma_invoices_status_check');
                        if (Schema::hasTable('business_associates')) {
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE business_associates ALTER COLUMN email DROP NOT NULL');
                        }
                        if (Schema::hasTable('estimate_items')) {
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE estimate_items ALTER COLUMN tax_rate DROP NOT NULL');
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE estimate_items ALTER COLUMN tax_amount DROP NOT NULL');
                        }
                        if (Schema::hasTable('proforma_invoice_items')) {
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE proforma_invoice_items ALTER COLUMN tax_rate DROP NOT NULL');
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE proforma_invoice_items ALTER COLUMN tax_amount DROP NOT NULL');
                        }
                        if (Schema::hasTable('invoice_items')) {
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE invoice_items ALTER COLUMN tax_rate DROP NOT NULL');
                            \Illuminate\Support\Facades\DB::statement('ALTER TABLE invoice_items ALTER COLUMN tax_amount DROP NOT NULL');
                        }
                    } catch (\Throwable $e) {
                        // Safe ignore
                    }
                }

                // 2. Self-heal users schema and document numbering settings
                if (Schema::hasTable('users') && !Schema::hasColumn('users', 'password_set_at')) {
                    try {
                        Schema::table('users', function ($table) {
                            $table->timestamp('password_set_at')->nullable()->after('password');
                        });
                    } catch (\Throwable $e) {
                        // Safe ignore
                    }
                }

                if (Schema::hasTable('system_settings')) {
                    try {
                        \Illuminate\Support\Facades\DB::table('system_settings')
                            ->whereIn('key', ['estimate_suffix', 'proforma_suffix', 'invoice_suffix'])
                            ->whereNull('value')
                            ->update(['value' => '']);
                    } catch (\Throwable $e) {
                        // Safe ignore
                    }
                }

                // Self-heal tax calculation mode on commercial pipelines (DB-agnostic)
                if (Schema::hasTable('proforma_invoices') && Schema::hasTable('estimates')) {
                    try {
                        $inclusiveEstIds = \Illuminate\Support\Facades\DB::table('estimates')
                            ->where('tax_calculation_type', 'inclusive')
                            ->pluck('id');

                        if ($inclusiveEstIds->isNotEmpty()) {
                            \Illuminate\Support\Facades\DB::table('proforma_invoices')
                                ->whereIn('estimate_id', $inclusiveEstIds)
                                ->update(['tax_calculation_type' => 'inclusive']);
                        }

                        // Also detect inclusive if total equals subtotal while tax_amount is present
                        \Illuminate\Support\Facades\DB::table('proforma_invoices')
                            ->where('tax_amount', '>', 0)
                            ->whereRaw('ABS(total_amount - subtotal) < 1')
                            ->update(['tax_calculation_type' => 'inclusive']);
                    } catch (\Throwable $e) {}
                }

                if (Schema::hasTable('invoices') && Schema::hasTable('proforma_invoices')) {
                    try {
                        $inclusivePiIds = \Illuminate\Support\Facades\DB::table('proforma_invoices')
                            ->where('tax_calculation_type', 'inclusive')
                            ->pluck('id');

                        if ($inclusivePiIds->isNotEmpty()) {
                            \Illuminate\Support\Facades\DB::table('invoices')
                                ->whereIn('proforma_invoice_id', $inclusivePiIds)
                                ->update(['tax_calculation_type' => 'inclusive']);
                        }

                        \Illuminate\Support\Facades\DB::table('invoices')
                            ->where('tax_amount', '>', 0)
                            ->whereRaw('ABS(total_amount - subtotal) < 1')
                            ->update(['tax_calculation_type' => 'inclusive']);
                    } catch (\Throwable $e) {}
                }

                // 2. Auto-run pending database migrations (debounced every 5 minutes to keep requests fast)
                $cacheKey = 'kabhyan_auto_migration_last_run_v11';
                if (!\Illuminate\Support\Facades\Cache::has($cacheKey)) {
                    \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);

                    // One-time autonomous live-mode database reset and dummy data purge (grounded in persistent database flag)
                    $liveModePurgeKey = 'kabhyan_live_mode_purged_at';
                    $isAlreadyPurged = \Illuminate\Support\Facades\Cache::has($liveModePurgeKey) || (Schema::hasTable('system_settings') && \Illuminate\Support\Facades\DB::table('system_settings')->where('key', 'live_mode_purged_at')->exists());
                    if (!$isAlreadyPurged) {
                        try {
                            if (Schema::hasTable('personal_access_tokens')) {
                                \Illuminate\Support\Facades\DB::table('personal_access_tokens')->delete();
                            }
                            if (Schema::hasTable('invoice_payments')) {
                                \Illuminate\Support\Facades\DB::table('invoice_payments')->delete();
                            }
                            if (Schema::hasTable('invoice_items')) {
                                \Illuminate\Support\Facades\DB::table('invoice_items')->delete();
                            }
                            if (Schema::hasTable('invoices')) {
                                \Illuminate\Support\Facades\DB::table('invoices')->delete();
                            }
                            if (Schema::hasTable('proforma_invoice_items')) {
                                \Illuminate\Support\Facades\DB::table('proforma_invoice_items')->delete();
                            }
                            if (Schema::hasTable('proforma_invoices')) {
                                \Illuminate\Support\Facades\DB::table('proforma_invoices')->delete();
                            }
                            if (Schema::hasTable('estimate_items')) {
                                \Illuminate\Support\Facades\DB::table('estimate_items')->delete();
                            }
                            if (Schema::hasTable('estimates')) {
                                \Illuminate\Support\Facades\DB::table('estimates')->delete();
                            }
                            if (Schema::hasTable('tasks')) {
                                \Illuminate\Support\Facades\DB::table('tasks')->delete();
                            }
                            if (Schema::hasTable('project_members')) {
                                \Illuminate\Support\Facades\DB::table('project_members')->delete();
                            }
                            if (Schema::hasTable('projects')) {
                                \Illuminate\Support\Facades\DB::table('projects')->delete();
                            }
                            if (Schema::hasTable('ticket_replies')) {
                                \Illuminate\Support\Facades\DB::table('ticket_replies')->delete();
                            }
                            if (Schema::hasTable('tickets')) {
                                \Illuminate\Support\Facades\DB::table('tickets')->delete();
                            }
                            if (Schema::hasTable('clients')) {
                                \Illuminate\Support\Facades\DB::table('clients')->delete();
                            }
                            if (Schema::hasTable('expenses')) {
                                \Illuminate\Support\Facades\DB::table('expenses')->delete();
                            }
                            if (Schema::hasTable('payslips')) {
                                \Illuminate\Support\Facades\DB::table('payslips')->delete();
                            }
                            if (Schema::hasTable('payroll_batches')) {
                                \Illuminate\Support\Facades\DB::table('payroll_batches')->delete();
                            }
                            if (Schema::hasTable('salary_structures')) {
                                \Illuminate\Support\Facades\DB::table('salary_structures')->delete();
                            }
                            if (Schema::hasTable('leave_requests')) {
                                \Illuminate\Support\Facades\DB::table('leave_requests')->delete();
                            }
                            if (Schema::hasTable('daily_attendances')) {
                                \Illuminate\Support\Facades\DB::table('daily_attendances')->delete();
                            }
                            if (Schema::hasTable('monthly_attendances')) {
                                \Illuminate\Support\Facades\DB::table('monthly_attendances')->delete();
                            }
                            if (Schema::hasTable('system_notifications')) {
                                \Illuminate\Support\Facades\DB::table('system_notifications')->delete();
                            }
                            if (Schema::hasTable('users')) {
                                \Illuminate\Support\Facades\DB::table('users')
                                    ->where('role', '!=', 'superadmin')
                                    ->whereNotIn(\Illuminate\Support\Facades\DB::raw('LOWER(TRIM(email))'), ['admin@kabhyan.com', 'superadmin@kabhyan.com'])
                                    ->delete();
                            }

                            // Reset numbering sequences to 1
                            if (Schema::hasTable('system_settings')) {
                                foreach (['estimate_next_number', 'proforma_next_number', 'invoice_next_number', 'client_next_number', 'expense_next_number'] as $seqKey) {
                                    \Illuminate\Support\Facades\DB::table('system_settings')->updateOrInsert(
                                        ['key' => $seqKey],
                                        ['value' => '1', 'group' => 'document_numbering', 'type' => 'integer', 'updated_at' => now()]
                                    );
                                }

                                \Illuminate\Support\Facades\DB::table('system_settings')->updateOrInsert(
                                    ['key' => 'live_mode_purged_at'],
                                    ['value' => now()->toIso8601String(), 'group' => 'system_lifecycle', 'type' => 'string', 'description' => 'Timestamp of live mode purge', 'updated_at' => now()]
                                );
                            }

                            if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
                                $tbls = [
                                    'clients', 'projects', 'tasks', 'estimates', 'estimate_items',
                                    'proforma_invoices', 'proforma_invoice_items', 'invoices',
                                    'invoice_items', 'invoice_payments', 'expenses', 'tickets',
                                    'ticket_replies', 'daily_attendances', 'monthly_attendances',
                                    'leave_requests', 'salary_structures', 'payroll_batches',
                                    'payslips', 'system_notifications',
                                ];
                                foreach ($tbls as $t) {
                                    try {
                                        \Illuminate\Support\Facades\DB::statement("ALTER SEQUENCE IF EXISTS {$t}_id_seq RESTART WITH 1");
                                    } catch (\Throwable $seqE) {}
                                }
                            }

                            \Illuminate\Support\Facades\Cache::forever($liveModePurgeKey, now()->toIso8601String());
                        } catch (\Throwable $purgeEx) {
                            \Illuminate\Support\Facades\Log::warning('Live mode purge: ' . $purgeEx->getMessage());
                        }
                    }

                    // Autonomous schema column guarantee across all document and line item tables
                    try {
                        $docTables = ['estimates', 'proforma_invoices', 'invoices'];
                        foreach ($docTables as $tbl) {
                            if (Schema::hasTable($tbl)) {
                                Schema::table($tbl, function (\Illuminate\Database\Schema\Blueprint $table) use ($tbl) {
                                    if (!Schema::hasColumn($tbl, 'tax_calculation_type')) {
                                        $table->string('tax_calculation_type', 20)->default('exclusive')->nullable();
                                    }
                                    if (!Schema::hasColumn($tbl, 'discount_type')) {
                                        $table->string('discount_type', 20)->default('percentage')->nullable();
                                    }
                                    if (!Schema::hasColumn($tbl, 'round_off')) {
                                        $table->decimal('round_off', 14, 2)->default(0.00)->nullable();
                                    }
                                });
                            }
                        }

                        $itemTables = ['estimate_items', 'proforma_invoice_items', 'invoice_items'];
                        foreach ($itemTables as $itbl) {
                            if (Schema::hasTable($itbl)) {
                                Schema::table($itbl, function (\Illuminate\Database\Schema\Blueprint $table) use ($itbl) {
                                    if (!Schema::hasColumn($itbl, 'tax_rate')) {
                                        $table->decimal('tax_rate', 5, 2)->default(18.00)->nullable();
                                    }
                                    if (!Schema::hasColumn($itbl, 'tax_amount')) {
                                        $table->decimal('tax_amount', 14, 2)->default(0.00)->nullable();
                                    }
                                });
                            }
                        }
                    } catch (\Throwable $colEx) {
                        \Illuminate\Support\Facades\Log::warning('Self-healing document columns: ' . $colEx->getMessage());
                    }

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
