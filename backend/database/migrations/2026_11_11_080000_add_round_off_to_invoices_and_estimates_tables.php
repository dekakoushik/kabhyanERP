<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('estimates') && !Schema::hasColumn('estimates', 'round_off')) {
            Schema::table('estimates', function (Blueprint $table) {
                $table->decimal('round_off', 10, 2)->default(0.00)->after('tax_amount');
            });
        }

        if (Schema::hasTable('proforma_invoices') && !Schema::hasColumn('proforma_invoices', 'round_off')) {
            Schema::table('proforma_invoices', function (Blueprint $table) {
                $table->decimal('round_off', 10, 2)->default(0.00)->after('tax_amount');
            });
        }

        if (Schema::hasTable('invoices') && !Schema::hasColumn('invoices', 'round_off')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->decimal('round_off', 10, 2)->default(0.00)->after('tax_amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('estimates') && Schema::hasColumn('estimates', 'round_off')) {
            Schema::table('estimates', function (Blueprint $table) {
                $table->dropColumn('round_off');
            });
        }

        if (Schema::hasTable('proforma_invoices') && Schema::hasColumn('proforma_invoices', 'round_off')) {
            Schema::table('proforma_invoices', function (Blueprint $table) {
                $table->dropColumn('round_off');
            });
        }

        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'round_off')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('round_off');
            });
        }
    }
};
