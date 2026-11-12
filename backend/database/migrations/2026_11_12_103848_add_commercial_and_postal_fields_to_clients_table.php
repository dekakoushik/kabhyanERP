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
        Schema::table('clients', function (Blueprint $table) {
            $table->string('postal_code', 20)->nullable()->after('country');
            $table->string('currency', 10)->default('INR')->after('postal_code');
            $table->string('payment_terms', 50)->default('Net 30')->after('currency');
            $table->string('pan', 20)->nullable()->after('gstin');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['postal_code', 'currency', 'payment_terms', 'pan']);
        });
    }
};

