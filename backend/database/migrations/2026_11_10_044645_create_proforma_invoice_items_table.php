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
        Schema::create('proforma_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proforma_invoice_id')->constrained('proforma_invoices')->cascadeOnDelete();
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->decimal('quantity', 10, 2)->default(1.00);
            $table->string('unit', 50)->default('hours');
            $table->decimal('unit_price', 14, 2)->default(0.00);
            $table->decimal('amount', 14, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proforma_invoice_items');
    }
};
