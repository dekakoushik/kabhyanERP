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
        if (Schema::hasTable('invoices') && !Schema::hasColumn('invoices', 'cashfree_link_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->string('cashfree_link_id')->nullable()->after('due_amount');
                $table->text('cashfree_link_url')->nullable()->after('cashfree_link_id');
                $table->text('cashfree_link_qrcode')->nullable()->after('cashfree_link_url');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'cashfree_link_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn(['cashfree_link_id', 'cashfree_link_url', 'cashfree_link_qrcode']);
            });
        }
    }
};
