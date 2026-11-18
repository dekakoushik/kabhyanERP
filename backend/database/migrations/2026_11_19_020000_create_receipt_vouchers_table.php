<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Statutory GST Receipt Vouchers under Section 31(3)(d) of CGST Act, 2017 & Rule 50.
     */
    public function up(): void
    {
        if (!Schema::hasTable('receipt_vouchers')) {
            Schema::create('receipt_vouchers', function (Blueprint $table) {
                $table->id();
                $table->string('voucher_number', 50)->unique(); // e.g. RV-2026-0001
                $table->foreignId('estimate_id')->nullable()->constrained('estimates')->nullOnDelete();
                $table->foreignId('proforma_invoice_id')->nullable()->constrained('proforma_invoices')->nullOnDelete();
                $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
                $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                // Client Snapshot
                $table->string('client_name');
                $table->string('client_company')->nullable();
                $table->string('client_email')->nullable();
                $table->string('client_phone', 50)->nullable();
                $table->text('client_address')->nullable();
                $table->string('client_gstin', 30)->nullable();

                // Financials & Statutory GST
                $table->date('voucher_date');
                $table->decimal('amount_received', 14, 2); // Gross advance received
                $table->string('tax_calculation_type', 20)->default('inclusive'); // inclusive / exclusive
                $table->decimal('taxable_amount', 14, 2);
                $table->decimal('tax_rate', 5, 2)->default(18.00);
                $table->decimal('tax_amount', 14, 2);
                $table->decimal('cgst_amount', 14, 2)->default(0.00);
                $table->decimal('sgst_amount', 14, 2)->default(0.00);
                $table->decimal('igst_amount', 14, 2)->default(0.00);
                $table->boolean('is_inter_state')->default(false);
                $table->string('place_of_supply', 100)->default('Assam (18)');

                // Payment Metadata
                $table->string('payment_mode', 50)->default('bank_transfer'); // bank_transfer, upi, cheque, card, cash
                $table->string('payment_reference')->nullable();

                // Status & Adjustment Lifecycle
                $table->string('status', 30)->default('active'); // active, adjusted, partially_adjusted, refunded
                $table->decimal('adjusted_amount', 14, 2)->default(0.00);
                $table->decimal('remaining_advance', 14, 2)->default(0.00);

                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receipt_vouchers');
    }
};
