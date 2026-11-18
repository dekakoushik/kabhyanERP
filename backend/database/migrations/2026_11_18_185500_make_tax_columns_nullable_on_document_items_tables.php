<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensures tax_rate and tax_amount columns on line item tables are nullable to prevent PostgreSQL not-null constraint failures.
     */
    public function up(): void
    {
        $tables = ['estimate_items', 'proforma_invoice_items', 'invoice_items'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                if (DB::getDriverName() === 'pgsql') {
                    if (Schema::hasColumn($table, 'tax_rate')) {
                        DB::statement("ALTER TABLE {$table} ALTER COLUMN tax_rate DROP NOT NULL");
                    }
                    if (Schema::hasColumn($table, 'tax_amount')) {
                        DB::statement("ALTER TABLE {$table} ALTER COLUMN tax_amount DROP NOT NULL");
                    }
                } else {
                    Schema::table($table, function (Blueprint $tableBlueprint) {
                        $tableBlueprint->decimal('tax_rate', 5, 2)->nullable()->default(18.00)->change();
                        $tableBlueprint->decimal('tax_amount', 14, 2)->nullable()->default(0.00)->change();
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op
    }
};
