<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for Live Production mode.
     * Retains ONLY official system roles, permissions, corporate settings,
     * and the primary SuperAdmin account.
     */
    public function run(): void
    {
        // 1. RBAC System Roles & Permissions (Idempotent)
        $this->call(RoleAndPermissionSeeder::class);

        // 2. Official Corporate System Settings (Idempotent)
        $this->call(SystemSettingSeeder::class);

        // 3. Primary Super Admin Authority (Sole Preserved System User)
        User::firstOrCreate(
            ['email' => 'superadmin@kabhyan.com'],
            [
                'name' => 'Kabhyan Super Admin',
                'phone' => '+91 9876543210',
                'role' => 'superadmin',
                'department' => 'Executive Office',
                'designation' => 'Chief Technology Officer',
                'status' => 'active',
                'password' => Hash::make('Kabhyan@2026'),
                'email_verified_at' => now(),
            ]
        );
    }
}
