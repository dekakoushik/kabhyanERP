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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique(); // e.g. INV-2026-001
            $table->foreignId('proforma_invoice_id')->nullable()->constrained('proforma_invoices')->nullOnDelete();
            $table->foreignId('estimate_id')->nullable()->constrained('estimates')->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('client_name');
            $table->string('client_company')->nullable();
            $table->string('client_email')->nullable();
            $table->string('client_phone')->nullable();
            $table->text('client_address')->nullable();
            $table->string('client_gstin', 30)->nullable(); // GST Identification Number
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->enum('status', ['unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled'])->default('unpaid');
            $table->string('currency', 10)->default('INR');
            $table->decimal('subtotal', 14, 2)->default(0.00);
            $table->decimal('tax_rate', 5, 2)->default(18.00); // 18% GST standard
            $table->decimal('tax_amount', 14, 2)->default(0.00);
            $table->decimal('discount_rate', 5, 2)->default(0.00);
            $table->decimal('discount_amount', 14, 2)->default(0.00);
            $table->decimal('total_amount', 14, 2)->default(0.00);
            $table->decimal('paid_amount', 14, 2)->default(0.00);
            $table->decimal('due_amount', 14, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->text('terms_and_conditions')->nullable();
            $table->text('bank_details')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
