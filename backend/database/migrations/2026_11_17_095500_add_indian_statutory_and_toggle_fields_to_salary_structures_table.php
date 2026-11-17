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
        // 1. Add Indian Statutory Fields & Component Toggles to Salary Structures
        if (Schema::hasTable('salary_structures')) {
            Schema::table('salary_structures', function (Blueprint $table) {
                // Allowance / Earnings Toggles
                if (!Schema::hasColumn('salary_structures', 'has_hra')) {
                    $table->boolean('has_hra')->default(true)->after('hra_monthly');
                }
                if (!Schema::hasColumn('salary_structures', 'has_conveyance')) {
                    $table->boolean('has_conveyance')->default(true)->after('conveyance_allowance');
                }
                if (!Schema::hasColumn('salary_structures', 'has_special_allowance')) {
                    $table->boolean('has_special_allowance')->default(true)->after('special_allowance');
                }

                // Statutory Deduction Toggles
                if (!Schema::hasColumn('salary_structures', 'has_epf')) {
                    $table->boolean('has_epf')->default(true)->after('pf_employee');
                }
                if (!Schema::hasColumn('salary_structures', 'has_esi')) {
                    $table->boolean('has_esi')->default(false)->after('has_epf');
                }
                if (!Schema::hasColumn('salary_structures', 'has_professional_tax')) {
                    $table->boolean('has_professional_tax')->default(true)->after('professional_tax');
                }
                if (!Schema::hasColumn('salary_structures', 'has_gratuity')) {
                    $table->boolean('has_gratuity')->default(true)->after('has_professional_tax');
                }
                if (!Schema::hasColumn('salary_structures', 'has_tds')) {
                    $table->boolean('has_tds')->default(false)->after('tds_monthly');
                }

                // Statutory Calculation & State Config
                if (!Schema::hasColumn('salary_structures', 'city_tier')) {
                    $table->string('city_tier', 20)->default('non_metro')->after('ctc_annual'); // non_metro (40%), metro (50%)
                }
                if (!Schema::hasColumn('salary_structures', 'epf_mode')) {
                    $table->string('epf_mode', 30)->default('statutory_capped')->after('has_epf'); // statutory_capped, actual, exempt
                }
                if (!Schema::hasColumn('salary_structures', 'epf_employer')) {
                    $table->decimal('epf_employer', 10, 2)->default(0)->after('epf_mode');
                }
                if (!Schema::hasColumn('salary_structures', 'esi_employee')) {
                    $table->decimal('esi_employee', 10, 2)->default(0)->after('has_esi');
                }
                if (!Schema::hasColumn('salary_structures', 'esi_employer')) {
                    $table->decimal('esi_employer', 10, 2)->default(0)->after('esi_employee');
                }
                if (!Schema::hasColumn('salary_structures', 'gratuity_monthly')) {
                    $table->decimal('gratuity_monthly', 10, 2)->default(0)->after('has_gratuity');
                }
                if (!Schema::hasColumn('salary_structures', 'pt_state')) {
                    $table->string('pt_state', 50)->default('Assam')->after('has_professional_tax');
                }
                if (!Schema::hasColumn('salary_structures', 'tax_regime')) {
                    $table->string('tax_regime', 20)->default('new')->after('has_tds'); // new (115BAC), old
                }
            });
        }

        // 2. Add Banking & Statutory KYC Details to Users Table
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'bank_name')) {
                    $table->string('bank_name', 100)->nullable()->after('designation');
                }
                if (!Schema::hasColumn('users', 'account_number')) {
                    $table->string('account_number', 50)->nullable()->after('bank_name');
                }
                if (!Schema::hasColumn('users', 'ifsc_code')) {
                    $table->string('ifsc_code', 20)->nullable()->after('account_number');
                }
                if (!Schema::hasColumn('users', 'pan_number')) {
                    $table->string('pan_number', 20)->nullable()->after('ifsc_code');
                }
                if (!Schema::hasColumn('users', 'uan_number')) {
                    $table->string('uan_number', 30)->nullable()->after('pan_number');
                }
                if (!Schema::hasColumn('users', 'esic_number')) {
                    $table->string('esic_number', 30)->nullable()->after('uan_number');
                }
            });
        }

        // 3. Add ESI Deduction to Payslips Table
        if (Schema::hasTable('payslips') && !Schema::hasColumn('payslips', 'esi_deduction')) {
            Schema::table('payslips', function (Blueprint $table) {
                $table->decimal('esi_deduction', 10, 2)->default(0)->after('pf_deduction');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('salary_structures')) {
            Schema::table('salary_structures', function (Blueprint $table) {
                $columns = [
                    'has_hra',
                    'has_conveyance',
                    'has_special_allowance',
                    'has_epf',
                    'has_esi',
                    'has_professional_tax',
                    'has_gratuity',
                    'has_tds',
                    'city_tier',
                    'epf_mode',
                    'epf_employer',
                    'esi_employee',
                    'esi_employer',
                    'gratuity_monthly',
                    'pt_state',
                    'tax_regime',
                ];
                $table->dropColumn(array_intersect($columns, Schema::getColumnListing('salary_structures')));
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $userCols = ['bank_name', 'account_number', 'ifsc_code', 'pan_number', 'uan_number', 'esic_number'];
                $table->dropColumn(array_intersect($userCols, Schema::getColumnListing('users')));
            });
        }

        if (Schema::hasTable('payslips') && Schema::hasColumn('payslips', 'esi_deduction')) {
            Schema::table('payslips', function (Blueprint $table) {
                $table->dropColumn('esi_deduction');
            });
        }
    }
};
