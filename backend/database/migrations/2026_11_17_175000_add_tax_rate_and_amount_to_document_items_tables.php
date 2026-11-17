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
        // 1. estimate_items
        if (Schema::hasTable('estimate_items')) {
            Schema::table('estimate_items', function (Blueprint $table) {
                if (!Schema::hasColumn('estimate_items', 'tax_rate')) {
                    $table->decimal('tax_rate', 5, 2)->default(18.00)->after('amount');
                }
                if (!Schema::hasColumn('estimate_items', 'tax_amount')) {
                    $table->decimal('tax_amount', 14, 2)->default(0.00)->after('tax_rate');
                }
            });
        }

        // 2. proforma_invoice_items
        if (Schema::hasTable('proforma_invoice_items')) {
            Schema::table('proforma_invoice_items', function (Blueprint $table) {
                if (!Schema::hasColumn('proforma_invoice_items', 'tax_rate')) {
                    $table->decimal('tax_rate', 5, 2)->default(18.00)->after('amount');
                }
                if (!Schema::hasColumn('proforma_invoice_items', 'tax_amount')) {
                    $table->decimal('tax_amount', 14, 2)->default(0.00)->after('tax_rate');
                }
            });
        }

        // 3. invoice_items
        if (Schema::hasTable('invoice_items')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                if (!Schema::hasColumn('invoice_items', 'tax_rate')) {
                    $table->decimal('tax_rate', 5, 2)->default(18.00)->after('amount');
                }
                if (!Schema::hasColumn('invoice_items', 'tax_amount')) {
                    $table->decimal('tax_amount', 14, 2)->default(0.00)->after('tax_rate');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('estimate_items')) {
            Schema::table('estimate_items', function (Blueprint $table) {
                $table->dropColumn(['tax_rate', 'tax_amount']);
            });
        }

        if (Schema::hasTable('proforma_invoice_items')) {
            Schema::table('proforma_invoice_items', function (Blueprint $table) {
                $table->dropColumn(['tax_rate', 'tax_amount']);
            });
        }

        if (Schema::hasTable('invoice_items')) {
            Schema::table('invoice_items', function (Blueprint $table) {
                $table->dropColumn(['tax_rate', 'tax_amount']);
            });
        }
    }
};
