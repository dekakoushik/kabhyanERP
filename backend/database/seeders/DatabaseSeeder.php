<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for Live Production mode.
     * Retains official system roles, permissions, corporate settings,
     * and ensures at least one active SuperAdmin account exists without
     * overwriting custom credentials.
     */
    public function run(): void
    {
        // 1. RBAC System Roles & Permissions (Idempotent)
        $this->call(RoleAndPermissionSeeder::class);

        // 2. Official Corporate System Settings (Idempotent)
        $this->call(SystemSettingSeeder::class);

        // 3. Ensure a SuperAdmin account exists (Never overwrite existing user's custom email/password)
        $hasSuperAdmin = User::where('role', 'superadmin')
            ->orWhereIn(User::raw('LOWER(TRIM(email))'), ['admin@kabhyan.com', 'superadmin@kabhyan.com'])
            ->orWhereHas('customRole', fn ($q) => $q->where('slug', 'superadmin'))
            ->exists();

        if (! $hasSuperAdmin) {
            $superadminRole = Role::where('slug', 'superadmin')->first();

            User::create([
                'employee_code' => 'EMP-001',
                'name' => 'Kabhyan Super Admin',
                'email' => 'admin@kabhyan.com',
                'phone' => '+91 9876543210',
                'role' => 'superadmin',
                'role_id' => $superadminRole?->id,
                'department' => 'Executive Office',
                'designation' => 'Chief Executive Officer',
                'status' => 'active',
                'password' => Hash::make('Kabyaa@2580@#'),
                'email_verified_at' => now(),
            ]);
        }
    }
}
