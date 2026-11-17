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
        // 1. Estimates Table
        if (Schema::hasTable('estimates')) {
            Schema::table('estimates', function (Blueprint $table) {
                if (!Schema::hasColumn('estimates', 'tax_calculation_type')) {
                    $table->string('tax_calculation_type', 20)->default('exclusive')->after('currency');
                }
                if (!Schema::hasColumn('estimates', 'discount_type')) {
                    $table->string('discount_type', 20)->default('percentage')->after('tax_amount');
                }
            });
        }

        // 2. Proforma Invoices Table
        if (Schema::hasTable('proforma_invoices')) {
            Schema::table('proforma_invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('proforma_invoices', 'tax_calculation_type')) {
                    $table->string('tax_calculation_type', 20)->default('exclusive')->after('currency');
                }
                if (!Schema::hasColumn('proforma_invoices', 'discount_type')) {
                    $table->string('discount_type', 20)->default('percentage')->after('tax_amount');
                }
            });
        }

        // 3. Tax Invoices Table
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                if (!Schema::hasColumn('invoices', 'tax_calculation_type')) {
                    $table->string('tax_calculation_type', 20)->default('exclusive')->after('currency');
                }
                if (!Schema::hasColumn('invoices', 'discount_type')) {
                    $table->string('discount_type', 20)->default('percentage')->after('tax_amount');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('estimates')) {
            Schema::table('estimates', function (Blueprint $table) {
                $table->dropColumn(['tax_calculation_type', 'discount_type']);
            });
        }

        if (Schema::hasTable('proforma_invoices')) {
            Schema::table('proforma_invoices', function (Blueprint $table) {
                $table->dropColumn(['tax_calculation_type', 'discount_type']);
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn(['tax_calculation_type', 'discount_type']);
            });
        }
    }
};
