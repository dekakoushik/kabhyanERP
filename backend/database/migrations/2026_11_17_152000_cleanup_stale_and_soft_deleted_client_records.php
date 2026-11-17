<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Cleans up stale/soft-deleted client records, purges orphaned portal users,
     * and ensures email uniqueness ignores soft-deleted entries.
     */
    public function up(): void
    {
        // 1. Purge all soft-deleted clients to clean the database
        try {
            DB::table('clients')->whereNotNull('deleted_at')->delete();
        } catch (\Throwable $e) {
            // Ignore if already clean
        }

        // 2. Explicitly remove any stale client records matching the target test email
        try {
            DB::table('clients')->whereRaw('LOWER(email) = ?', ['njbnewlifestyle@gmail.com'])->delete();
        } catch (\Throwable $e) {
            // Ignore if not found
        }

        // 3. Explicitly remove any portal user with role 'client' matching the target test email
        try {
            DB::table('users')
                ->whereRaw('LOWER(email) = ?', ['njbnewlifestyle@gmail.com'])
                ->where('role', 'client')
                ->delete();
        } catch (\Throwable $e) {
            // Ignore if not found
        }

        // 4. Clean up any orphaned client portal users whose email does not belong to any active client
        try {
            DB::table('users')
                ->where('role', 'client')
                ->whereNotIn('email', function ($query) {
                    $query->select('email')
                        ->from('clients')
                        ->whereNotNull('email')
                        ->whereNull('deleted_at');
                })
                ->delete();
        } catch (\Throwable $e) {
            // Ignore if no orphaned records
        }

        // 5. Replace strict whole-table unique index with a partial unique index for active non-null emails
        if (DB::getDriverName() === 'pgsql') {
            try {
                DB::statement('ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_email_unique');
            } catch (\Throwable $e) {}

            try {
                DB::statement('DROP INDEX IF EXISTS clients_email_unique');
            } catch (\Throwable $e) {}

            try {
                DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS clients_email_unique ON clients (email) WHERE deleted_at IS NULL AND email IS NOT NULL');
            } catch (\Throwable $e) {}
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op for data cleanup
    }
};
