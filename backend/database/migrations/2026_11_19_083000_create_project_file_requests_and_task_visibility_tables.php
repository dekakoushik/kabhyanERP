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
        // 1. Add show_tasks_to_client toggle to projects
        if (Schema::hasTable('projects') && !Schema::hasColumn('projects', 'show_tasks_to_client')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->boolean('show_tasks_to_client')->default(false)->after('progress_percentage');
            });
        }

        // 2. Create project_file_requests table for PM document requests from client
        if (!Schema::hasTable('project_file_requests')) {
            Schema::create('project_file_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
                $table->foreignId('client_id')->constrained()->cascadeOnDelete();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('file_type_allowed')->default('any'); // any, pdf, image, archive, document
                $table->date('due_date')->nullable();
                $table->string('priority')->default('normal'); // normal, high, urgent
                $table->string('status')->default('pending'); // pending, submitted, approved, rejected
                $table->string('file_path')->nullable();
                $table->string('file_name')->nullable();
                $table->unsignedBigInteger('file_size')->nullable();
                $table->string('mime_type')->nullable();
                $table->timestamp('uploaded_at')->nullable();
                $table->text('review_notes')->nullable();
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('reviewed_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['project_id', 'status']);
                $table->index(['client_id', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_file_requests');

        if (Schema::hasTable('projects') && Schema::hasColumn('projects', 'show_tasks_to_client')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropColumn('show_tasks_to_client');
            });
        }
    }
};
