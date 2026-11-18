<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Pivot tracking statutory advance adjustments against Final Tax Invoices (GSTR-1 Table 11B).
     */
    public function up(): void
    {
        if (!Schema::hasTable('invoice_advance_adjustments')) {
            Schema::create('invoice_advance_adjustments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
                $table->foreignId('receipt_voucher_id')->constrained('receipt_vouchers')->restrictOnDelete();
                $table->decimal('amount_adjusted', 14, 2);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_advance_adjustments');
    }
};
