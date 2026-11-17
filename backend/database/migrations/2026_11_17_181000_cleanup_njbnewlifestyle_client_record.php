<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Delete any existing client records or client portal accounts with email njbnewlifestyle@gmail.com
        // so the user can cleanly register it via Quick Register Client or standard form without unique constraint failure.
        $targetEmail = 'njbnewlifestyle@gmail.com';

        DB::table('clients')->whereRaw('LOWER(TRIM(email)) = ?', [$targetEmail])->delete();
        DB::table('users')->whereRaw('LOWER(TRIM(email)) = ?', [$targetEmail])->where('role', 'client')->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op
    }
};
