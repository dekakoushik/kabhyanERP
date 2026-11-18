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
        if (Schema::hasTable('invoices') && !Schema::hasColumn('invoices', 'advance_adjusted')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->decimal('advance_adjusted', 14, 2)->default(0.00)->after('paid_amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'advance_adjusted')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('advance_adjusted');
            });
        }
    }
};
