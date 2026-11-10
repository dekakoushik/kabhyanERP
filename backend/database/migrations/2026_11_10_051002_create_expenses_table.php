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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('expense_number')->unique(); // e.g. EXP-2026-001
            $table->foreignId('expense_category_id')->constrained('expense_categories')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('vendor_name')->nullable(); // e.g. "Amazon Web Services", "Airtel Broadband", "Landlord"
            $table->string('vendor_gstin')->nullable();
            $table->date('expense_date');
            $table->decimal('amount', 12, 2); // Base or net amount
            $table->decimal('tax_amount', 12, 2)->default(0); // Input GST credit claimable
            $table->decimal('total_amount', 12, 2);
            $table->string('currency', 10)->default('INR');
            $table->enum('payment_method', ['bank_transfer', 'upi', 'neft', 'rtgs', 'corporate_card', 'cash', 'cheque'])->default('bank_transfer');
            $table->string('transaction_reference')->nullable(); // UTR / Cheque No.
            $table->enum('status', ['paid', 'pending', 'cancelled'])->default('paid');
            $table->string('receipt_attachment')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};

