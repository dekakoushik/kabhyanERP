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
        if (!Schema::hasTable('client_device_tokens')) {
            Schema::create('client_device_tokens', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('client_id')->nullable()->constrained()->cascadeOnDelete();
                $table->string('push_token', 255)->unique();
                $table->string('platform', 20)->default('android'); // 'android' | 'ios'
                $table->string('device_name', 150)->nullable();
                $table->timestamp('last_active_at')->useCurrent();
                $table->timestamps();

                $table->index(['user_id', 'client_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_device_tokens');
    }
};
