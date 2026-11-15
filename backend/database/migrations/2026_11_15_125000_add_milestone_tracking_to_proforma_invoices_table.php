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
        Schema::table('proforma_invoices', function (Blueprint $table) {
            $table->decimal('invoiced_amount', 14, 2)->default(0.00)->after('paid_amount');
            $table->decimal('remaining_amount', 14, 2)->default(0.00)->after('invoiced_amount');
            $table->string('status', 50)->default('unpaid')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proforma_invoices', function (Blueprint $table) {
            $table->dropColumn(['invoiced_amount', 'remaining_amount']);
        });
    }
};
