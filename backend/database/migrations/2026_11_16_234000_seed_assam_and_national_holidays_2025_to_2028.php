<?php

use App\Services\AssamHolidaysRegistry;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $holidays = AssamHolidaysRegistry::getHolidays();

        foreach ($holidays as $h) {
            DB::table('company_holidays')->updateOrInsert(
                ['holiday_date' => $h['holiday_date']],
                [
                    'title' => $h['title'],
                    'is_optional' => $h['is_optional'],
                    'description' => $h['description'],
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe down: do not delete user-modified holidays
    }
};
