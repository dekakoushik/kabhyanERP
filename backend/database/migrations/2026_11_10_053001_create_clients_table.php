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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete(); // Portal login account
            $table->string('client_code')->unique(); // e.g. CLI-2026-001
            $table->string('name'); // Primary contact person
            $table->string('company_name'); // Business entity name
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('gstin')->nullable();
            $table->text('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->default('West Bengal');
            $table->string('country')->default('India');
            $table->string('portal_access_status')->default('active'); // active, inactive
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Add client_id foreign key to projects table
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('client_id')->nullable()->after('client_name')->constrained('clients')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['client_id']);
            $table->dropColumn('client_id');
        });

        Schema::dropIfExists('clients');
    }
};

