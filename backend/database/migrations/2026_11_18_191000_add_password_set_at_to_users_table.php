<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds password_set_at timestamp to track whether users have configured their private password.
     */
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'password_set_at')) {
                    $table->timestamp('password_set_at')->nullable()->after('password');
                }
            });

            // Backfill existing staff and administrative users (they already have operational passwords)
            DB::table('users')
                ->where('role', '!=', 'client')
                ->whereNull('password_set_at')
                ->update([
                    'password_set_at' => DB::raw('COALESCE(created_at, NOW())'),
                ]);

            // Backfill existing clients who have logged in or do NOT have a pending invitation token
            $pendingEmails = DB::table('password_reset_tokens')->pluck('email')->toArray();

            DB::table('users')
                ->where('role', 'client')
                ->whereNull('password_set_at')
                ->where(function ($query) use ($pendingEmails) {
                    $query->whereNotNull('last_login_at');
                    if (!empty($pendingEmails)) {
                        $query->orWhereNotIn('email', $pendingEmails);
                    }
                })
                ->update([
                    'password_set_at' => DB::raw('COALESCE(last_login_at, created_at, NOW())'),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'password_set_at')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('password_set_at');
            });
        }
    }
};
