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
        // 1. Office Geofences for Automated Mobile Validation
        if (!Schema::hasTable('office_geofences')) {
            Schema::create('office_geofences', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->decimal('latitude', 10, 7);
                $table->decimal('longitude', 10, 7);
                $table->integer('radius_meters')->default(100);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });

            // Seed default Kabhyan Technologies Guwahati Office geofence
            DB::table('office_geofences')->insert([
                'name' => 'Kabhyan Technologies HQ - Guwahati',
                'latitude' => 26.1445169,
                'longitude' => 91.7362365,
                'radius_meters' => 150,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 2. Daily Attendance Punches & Manual Daily Roster
        if (!Schema::hasTable('daily_attendances')) {
            Schema::create('daily_attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->date('attendance_date');
                $table->timestamp('punch_in')->nullable();
                $table->timestamp('punch_out')->nullable();

                // Geolocation & Address (for mobile tracking)
                $table->decimal('punch_in_latitude', 10, 7)->nullable();
                $table->decimal('punch_in_longitude', 10, 7)->nullable();
                $table->string('punch_in_address')->nullable();

                $table->decimal('punch_out_latitude', 10, 7)->nullable();
                $table->decimal('punch_out_longitude', 10, 7)->nullable();
                $table->string('punch_out_address')->nullable();

                // Device & Network Metadata
                $table->string('device_id')->nullable();
                $table->string('device_model')->nullable();
                $table->string('ip_address', 45)->nullable();

                // Classification & Source
                $table->string('status')->default('present'); // present, absent, half_day, on_leave, holiday, wfh
                $table->string('source')->default('manual_admin'); // manual_admin, mobile_gps, mobile_qr, biometric
                $table->integer('work_minutes')->default(0);
                $table->boolean('is_late')->default(false);
                $table->boolean('is_half_day')->default(false);

                // Admin Audit & Override
                $table->boolean('is_overridden')->default(false);
                $table->foreignId('overridden_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('override_reason')->nullable();

                $table->timestamps();

                $table->unique(['user_id', 'attendance_date']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_attendances');
        Schema::dropIfExists('office_geofences');
    }
};
