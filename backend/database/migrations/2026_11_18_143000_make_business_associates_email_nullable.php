<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('business_associates')) {
            // Direct PostgreSQL / MySQL alter statement to make email nullable
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE business_associates ALTER COLUMN email DROP NOT NULL;');
            } else {
                Schema::table('business_associates', function (Blueprint $table) {
                    $table->string('email')->nullable()->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('business_associates')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE business_associates ALTER COLUMN email SET NOT NULL;');
            } else {
                Schema::table('business_associates', function (Blueprint $table) {
                    $table->string('email')->nullable(false)->change();
                });
            }
        }
    }
};
