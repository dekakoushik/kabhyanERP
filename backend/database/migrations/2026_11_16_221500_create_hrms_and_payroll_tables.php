<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Leave Types
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->integer('annual_quota')->default(0);
            $table->boolean('is_paid')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Leave Requests
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_types')->restrictOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('days_count', 4, 1)->default(1.0);
            $table->boolean('is_half_day')->default(false);
            $table->string('half_day_type')->nullable(); // 'first_half', 'second_half'
            $table->text('reason');
            $table->string('status')->default('pending'); // 'pending', 'approved', 'rejected'
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
        });

        // 3. Company Holidays
        Schema::create('company_holidays', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->date('holiday_date')->unique();
            $table->boolean('is_optional')->default(false);
            $table->string('description')->nullable();
            $table->timestamps();
        });

        // 4. Monthly Attendance & LOP Ledger
        Schema::create('monthly_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('month');
            $table->integer('year');
            $table->integer('total_days')->default(30);
            $table->integer('working_days')->default(22);
            $table->decimal('approved_leaves', 4, 1)->default(0);
            $table->decimal('lop_days', 4, 1)->default(0);
            $table->decimal('paid_days', 4, 1)->default(30);
            $table->text('notes')->nullable();
            $table->unique(['user_id', 'month', 'year']);
            $table->timestamps();
        });

        // 5. Salary Structures (Indian Statutory CTC Components)
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('ctc_annual', 12, 2)->default(0);
            $table->decimal('basic_monthly', 10, 2)->default(0);
            $table->decimal('hra_monthly', 10, 2)->default(0);
            $table->decimal('special_allowance', 10, 2)->default(0);
            $table->decimal('conveyance_allowance', 10, 2)->default(0);
            $table->decimal('pf_employee', 10, 2)->default(0);
            $table->decimal('professional_tax', 10, 2)->default(200.00); // Standard Indian PT
            $table->decimal('tds_monthly', 10, 2)->default(0);
            $table->date('effective_from')->nullable();
            $table->timestamps();
        });

        // 6. Payroll Batches
        Schema::create('payroll_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_number')->unique();
            $table->integer('month');
            $table->integer('year');
            $table->decimal('total_gross', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('total_net', 12, 2)->default(0);
            $table->integer('staff_count')->default(0);
            $table->string('status')->default('draft'); // 'draft', 'finalized', 'paid'
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unique(['month', 'year']);
            $table->timestamps();
        });

        // 7. Payslips
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_batch_id')->constrained('payroll_batches')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('payslip_number')->unique();
            $table->integer('month');
            $table->integer('year');
            $table->decimal('basic_salary', 10, 2)->default(0);
            $table->decimal('hra', 10, 2)->default(0);
            $table->decimal('allowances', 10, 2)->default(0);
            $table->decimal('bonus', 10, 2)->default(0);
            $table->decimal('gross_earnings', 10, 2)->default(0);
            $table->decimal('pf_deduction', 10, 2)->default(0);
            $table->decimal('pt_deduction', 10, 2)->default(0);
            $table->decimal('tds_deduction', 10, 2)->default(0);
            $table->decimal('lop_deduction', 10, 2)->default(0);
            $table->decimal('total_deductions', 10, 2)->default(0);
            $table->decimal('net_pay', 10, 2)->default(0);
            $table->integer('total_days')->default(30);
            $table->decimal('paid_days', 4, 1)->default(30);
            $table->decimal('lop_days', 4, 1)->default(0);
            $table->string('payment_status')->default('unpaid'); // 'unpaid', 'paid'
            $table->string('payment_method')->nullable();
            $table->string('transaction_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->unique(['user_id', 'month', 'year']);
            $table->timestamps();
        });

        // Seed baseline leave types
        DB::table('leave_types')->insertOrIgnore([
            [
                'name' => 'Paid / Casual Leave',
                'code' => 'CL',
                'annual_quota' => 18,
                'is_paid' => true,
                'description' => 'General planned personal and casual leaves accrued annually.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Sick Leave',
                'code' => 'SL',
                'annual_quota' => 12,
                'is_paid' => true,
                'description' => 'Medical and health recuperation leave.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Maternity Leave',
                'code' => 'ML',
                'annual_quota' => 180,
                'is_paid' => true,
                'description' => 'Statutory maternity leave for mothers.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Paternity Leave',
                'code' => 'PL',
                'annual_quota' => 15,
                'is_paid' => true,
                'description' => 'Statutory paternity leave for fathers.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Unpaid Leave (LOP)',
                'code' => 'LOP',
                'annual_quota' => 0,
                'is_paid' => false,
                'description' => 'Loss of Pay leave taken beyond annual quota or unauthorized absence.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // Seed sample 2026 Indian holidays
        DB::table('company_holidays')->insertOrIgnore([
            ['title' => 'New Year\'s Day', 'holiday_date' => '2026-01-01', 'is_optional' => false, 'description' => 'National Holiday', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Republic Day', 'holiday_date' => '2026-01-26', 'is_optional' => false, 'description' => 'National Gazette Holiday', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Holi', 'holiday_date' => '2026-03-04', 'is_optional' => false, 'description' => 'Festival of Colors', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Good Friday', 'holiday_date' => '2026-04-03', 'is_optional' => false, 'description' => 'Gazette Holiday', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Independence Day', 'holiday_date' => '2026-08-15', 'is_optional' => false, 'description' => 'National Holiday', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Mahatma Gandhi Jayanti', 'holiday_date' => '2026-10-02', 'is_optional' => false, 'description' => 'National Holiday', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Maha Navami / Dussehra', 'holiday_date' => '2026-10-20', 'is_optional' => false, 'description' => 'Durga Puja / Dussehra', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Diwali', 'holiday_date' => '2026-11-08', 'is_optional' => false, 'description' => 'Festival of Lights', 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Christmas Day', 'holiday_date' => '2026-12-25', 'is_optional' => false, 'description' => 'Gazette Holiday', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_batches');
        Schema::dropIfExists('salary_structures');
        Schema::dropIfExists('monthly_attendances');
        Schema::dropIfExists('company_holidays');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_types');
    }
};
