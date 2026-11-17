<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Autonomous purge of all dummy, seed, and test data for official Live Production Launch.
     * Retains ONLY superadmin@kabhyan.com, RBAC structure, and official corporate settings.
     */
    public function up(): void
    {
        // 1. Purge Personal Access Tokens / Stale Sessions
        if (Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->delete();
        }

        // 2. Purge Commercial Billing Ledger (in reverse dependency order)
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

        // 3. Purge Projects, Tasks, and Members
        if (Schema::hasTable('tasks')) {
            DB::table('tasks')->delete();
        }
        if (Schema::hasTable('project_members')) {
            DB::table('project_members')->delete();
        }
        if (Schema::hasTable('projects')) {
            DB::table('projects')->delete();
        }

        // 4. Purge Support Tickets & Conversations
        if (Schema::hasTable('ticket_replies')) {
            DB::table('ticket_replies')->delete();
        }
        if (Schema::hasTable('tickets')) {
            DB::table('tickets')->delete();
        }

        // 5. Purge CRM Clients Directory
        if (Schema::hasTable('clients')) {
            DB::table('clients')->delete();
        }

        // 6. Purge Organizational Expenses Ledger
        if (Schema::hasTable('expenses')) {
            DB::table('expenses')->delete();
        }

        // 7. Purge HRMS, Attendances & Payroll
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

        // 8. Purge System Notifications
        if (Schema::hasTable('system_notifications')) {
            DB::table('system_notifications')->delete();
        }

        // 9. Purge Users: Purge ALL users except superadmin@kabhyan.com
        if (Schema::hasTable('users')) {
            DB::table('users')
                ->whereRaw('LOWER(TRIM(email)) != ?', ['superadmin@kabhyan.com'])
                ->delete();
        }

        // 10. Reset Document Numbering Sequences in System Settings
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

            // Record permanent live purge milestone timestamp
            DB::table('system_settings')->updateOrInsert(
                ['key' => 'live_mode_purged_at'],
                [
                    'value' => now()->toIso8601String(),
                    'group' => 'system_lifecycle',
                    'type' => 'string',
                    'description' => 'Timestamp of official live mode reset and dummy data purge',
                    'updated_at' => now(),
                ]
            );
        }

        // 11. PostgreSQL Auto-Increment Sequence Reset
        if (DB::getDriverName() === 'pgsql') {
            $tables = [
                'clients',
                'projects',
                'tasks',
                'estimates',
                'estimate_items',
                'proforma_invoices',
                'proforma_invoice_items',
                'invoices',
                'invoice_items',
                'invoice_payments',
                'expenses',
                'tickets',
                'ticket_replies',
                'daily_attendances',
                'monthly_attendances',
                'leave_requests',
                'salary_structures',
                'payroll_batches',
                'payslips',
                'system_notifications',
            ];

            foreach ($tables as $tbl) {
                try {
                    DB::statement("ALTER SEQUENCE IF EXISTS {$tbl}_id_seq RESTART WITH 1");
                } catch (\Throwable $e) {
                    // Safe ignore if sequence naming varies
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Irreversible live mode reset
    }
};
