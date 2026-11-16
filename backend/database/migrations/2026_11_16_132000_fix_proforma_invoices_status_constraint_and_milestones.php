<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('proforma_invoices')) {
            // 1. Ensure milestone tracking columns exist
            Schema::table('proforma_invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('proforma_invoices', 'invoiced_amount')) {
                    $table->decimal('invoiced_amount', 14, 2)->default(0.00)->after('paid_amount');
                }
                if (!Schema::hasColumn('proforma_invoices', 'remaining_amount')) {
                    $table->decimal('remaining_amount', 14, 2)->default(0.00)->after('invoiced_amount');
                }
            });

            // 2. In PostgreSQL, drop the enum check constraint on status column so milestone statuses are accepted
            try {
                DB::statement('ALTER TABLE proforma_invoices DROP CONSTRAINT IF EXISTS proforma_invoices_status_check');
            } catch (\Throwable $e) {
                // Not PostgreSQL or constraint absent
            }

            // 3. Ensure status column is a flexible varchar(50)
            try {
                Schema::table('proforma_invoices', function (Blueprint $table) {
                    $table->string('status', 50)->default('unpaid')->change();
                });
            } catch (\Throwable $e) {
                try {
                    DB::statement('ALTER TABLE proforma_invoices ALTER COLUMN status TYPE VARCHAR(50)');
                } catch (\Throwable $e2) {
                    // Ignored if already varchar
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op to prevent breaking existing milestone records
    }
};
