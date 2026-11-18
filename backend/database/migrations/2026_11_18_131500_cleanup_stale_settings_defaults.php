<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Cleans up stale dummy defaults in system_settings, such as the sample LUT number.
     */
    public function up(): void
    {
        if (!Schema::hasTable('system_settings')) {
            return;
        }

        // Clean stale dummy LUT number if present
        DB::table('system_settings')
            ->where('key', 'lut_number')
            ->where('value', 'ARN-AD180226001924L')
            ->update([
                'value' => '',
                'updated_at' => now(),
            ]);

        // Clean dummy phone/address if present
        DB::table('system_settings')
            ->where('key', 'company_phone')
            ->where('value', '+91 98200 12345')
            ->update([
                'value' => '+91 70869 59737',
                'updated_at' => now(),
            ]);

        DB::table('system_settings')
            ->where('key', 'company_address')
            ->where('value', 'like', '%Bandra Kurla Complex%')
            ->update([
                'value' => 'GMCH Road, near Dispur College Road, Kachari Basti, Ganeshguri, Guwahati, Assam 781005',
                'updated_at' => now(),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op
    }
};
