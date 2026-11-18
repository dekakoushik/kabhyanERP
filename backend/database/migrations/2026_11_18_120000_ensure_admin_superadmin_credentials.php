<?php

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Permanently establishes and secures admin@kabhyan.com as primary SuperAdmin
     * with password Kabyaa@2580@# and synchronizes superadmin@kabhyan.com credentials.
     */
    public function up(): void
    {
        if (!Schema::hasTable('users')) {
            return;
        }

        // 1. Resolve SuperAdmin role ID
        $superadminRoleId = null;
        if (Schema::hasTable('roles')) {
            $superadminRole = DB::table('roles')->where('slug', 'superadmin')->first();
            $superadminRoleId = $superadminRole?->id;
        }

        $hashedPassword = Hash::make('Kabyaa@2580@#');

        // 2. Clean up any soft-deleted conflicting rows for admin@kabhyan.com
        DB::table('users')
            ->whereRaw('LOWER(TRIM(email)) = ?', ['admin@kabhyan.com'])
            ->whereNotNull('deleted_at')
            ->delete();

        // 3. Upsert admin@kabhyan.com as primary Super Administrator
        $existingAdmin = DB::table('users')
            ->whereRaw('LOWER(TRIM(email)) = ?', ['admin@kabhyan.com'])
            ->first();

        if ($existingAdmin) {
            DB::table('users')
                ->where('id', $existingAdmin->id)
                ->update([
                    'name' => 'Kabhyan Super Admin',
                    'email' => 'admin@kabhyan.com',
                    'password' => $hashedPassword,
                    'role' => 'superadmin',
                    'role_id' => $superadminRoleId ?? $existingAdmin->role_id,
                    'status' => 'active',
                    'department' => 'Executive Office',
                    'designation' => 'Chief Executive Officer',
                    'phone' => '+91 9876543210',
                    'email_verified_at' => now(),
                    'deleted_at' => null,
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('users')->insert([
                'employee_code' => 'EMP-001',
                'name' => 'Kabhyan Super Admin',
                'email' => 'admin@kabhyan.com',
                'phone' => '+91 9876543210',
                'role' => 'superadmin',
                'role_id' => $superadminRoleId,
                'department' => 'Executive Office',
                'designation' => 'Chief Executive Officer',
                'date_of_joining' => now()->toDateString(),
                'status' => 'active',
                'password' => $hashedPassword,
                'email_verified_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 4. Also synchronize superadmin@kabhyan.com with matching credentials if it exists
        $existingSuperadmin = DB::table('users')
            ->whereRaw('LOWER(TRIM(email)) = ?', ['superadmin@kabhyan.com'])
            ->first();

        if ($existingSuperadmin) {
            DB::table('users')
                ->where('id', $existingSuperadmin->id)
                ->update([
                    'password' => $hashedPassword,
                    'role' => 'superadmin',
                    'role_id' => $superadminRoleId ?? $existingSuperadmin->role_id,
                    'status' => 'active',
                    'deleted_at' => null,
                    'updated_at' => now(),
                ]);
        }

        // 5. Ensure personal access tokens are cleared so fresh login issues fresh token
        if (Schema::hasTable('personal_access_tokens')) {
            DB::table('personal_access_tokens')->delete();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe no-op
    }
};
