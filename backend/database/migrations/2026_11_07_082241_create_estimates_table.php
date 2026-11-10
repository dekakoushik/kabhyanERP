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
        Schema::create('estimates', function (Blueprint $table) {
            $table->id();
            $table->string('estimate_number')->unique(); // e.g. EST-2026-001
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('client_name');
            $table->string('client_email')->nullable();
            $table->string('client_company')->nullable();
            $table->string('client_phone')->nullable();
            $table->text('client_address')->nullable();
            $table->date('estimate_date');
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['draft', 'sent', 'accepted', 'declined', 'invoiced'])->default('draft');
            $table->string('currency', 10)->default('INR'); // INR, USD, EUR, GBP
            $table->decimal('subtotal', 14, 2)->default(0.00);
            $table->decimal('tax_rate', 5, 2)->default(0.00); // e.g. 18.00%
            $table->decimal('tax_amount', 14, 2)->default(0.00);
            $table->decimal('discount_rate', 5, 2)->default(0.00); // e.g. 5.00%
            $table->decimal('discount_amount', 14, 2)->default(0.00);
            $table->decimal('total_amount', 14, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->text('terms_and_conditions')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimates');
    }
};
