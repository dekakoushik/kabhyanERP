<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Statutory GST Refund Vouchers under Section 31(3)(e) of CGST Act, 2017 & Rule 51.
     */
    public function up(): void
    {
        if (!Schema::hasTable('refund_vouchers')) {
            Schema::create('refund_vouchers', function (Blueprint $table) {
                $table->id();
                $table->string('voucher_number', 50)->unique(); // e.g. RFV-2026-0001
                $table->foreignId('receipt_voucher_id')->constrained('receipt_vouchers')->onDelete('restrict');
                $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                $table->date('voucher_date');
                $table->decimal('refund_amount', 14, 2);
                $table->decimal('taxable_amount', 14, 2);
                $table->decimal('tax_rate', 5, 2)->default(18.00);
                $table->decimal('tax_amount', 14, 2);
                $table->decimal('cgst_amount', 14, 2)->default(0.00);
                $table->decimal('sgst_amount', 14, 2)->default(0.00);
                $table->decimal('igst_amount', 14, 2)->default(0.00);

                $table->string('refund_mode', 50)->default('bank_transfer');
                $table->string('refund_reference')->nullable();
                $table->text('reason');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('refund_vouchers');
    }
};
