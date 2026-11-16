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
        // 1. Roles table
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100);
                $table->string('slug', 100)->unique();
                $table->text('description')->nullable();
                $table->string('color', 30)->default('blue');
                $table->boolean('is_system')->default(false);
                $table->timestamps();
            });
        }

        // 2. Permissions table
        if (!Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('module', 50); // e.g. invoices, projects, staff
                $table->string('action', 50); // e.g. view, create, edit, delete, export
                $table->string('slug', 100)->unique(); // e.g. invoices.create
                $table->string('name', 150);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // 3. Pivot: role_has_permissions
        if (!Schema::hasTable('role_has_permissions')) {
            Schema::create('role_has_permissions', function (Blueprint $table) {
                $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
                $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
                $table->primary(['role_id', 'permission_id']);
            });
        }

        // 4. Pivot: user_has_permissions (Direct per-staff granular permission overrides)
        if (!Schema::hasTable('user_has_permissions')) {
            Schema::create('user_has_permissions', function (Blueprint $table) {
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
                $table->boolean('is_granted')->default(true);
                $table->primary(['user_id', 'permission_id']);
            });
        }

        // 5. Expand users table with role_id and staff metadata
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'role_id')) {
                    $table->foreignId('role_id')->nullable()->after('role')->constrained('roles')->nullOnDelete();
                }
                if (!Schema::hasColumn('users', 'employee_code')) {
                    $table->string('employee_code', 50)->nullable()->unique()->after('id');
                }
                if (!Schema::hasColumn('users', 'date_of_joining')) {
                    $table->date('date_of_joining')->nullable()->after('designation');
                }
                if (!Schema::hasColumn('users', 'emergency_contact')) {
                    $table->string('emergency_contact', 100)->nullable()->after('phone');
                }
            });
        }

        // Auto-seed standard roles and modular permissions
        try {
            (new \Database\Seeders\RoleAndPermissionSeeder())->run();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("Could not auto-seed roles and permissions: " . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'role_id')) {
                    $table->dropForeign(['role_id']);
                    $table->dropColumn('role_id');
                }
                if (Schema::hasColumn('users', 'employee_code')) {
                    $table->dropColumn('employee_code');
                }
                if (Schema::hasColumn('users', 'date_of_joining')) {
                    $table->dropColumn('date_of_joining');
                }
                if (Schema::hasColumn('users', 'emergency_contact')) {
                    $table->dropColumn('emergency_contact');
                }
            });
        }

        Schema::dropIfExists('user_has_permissions');
        Schema::dropIfExists('role_has_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
