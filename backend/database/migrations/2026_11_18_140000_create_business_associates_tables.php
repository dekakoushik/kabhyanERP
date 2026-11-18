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
        // 1. Business Associates Table
        if (!Schema::hasTable('business_associates')) {
            Schema::create('business_associates', function (Blueprint $table) {
                $table->id();
                $table->string('associate_code')->unique(); // e.g. BA-001
                $table->string('name');
                $table->string('email')->unique();
                $table->string('phone');
                $table->string('emergency_contact')->nullable();
                $table->text('address')->nullable();
                $table->string('city')->nullable();
                $table->string('state')->default('Assam');
                $table->string('pincode', 10)->nullable();

                // Tax & Compliance
                $table->string('pan_number', 10)->nullable();
                $table->string('gstin', 15)->nullable();

                // Engagement Model & Compensation
                $table->enum('engagement_model', ['salary', 'commission', 'hybrid'])->default('commission');
                $table->decimal('base_salary', 12, 2)->default(0.00);
                $table->decimal('commission_rate', 5, 2)->default(0.00); // e.g. 10.00%
                $table->enum('commission_basis', ['taxable_turnover', 'gross_amount'])->default('taxable_turnover');
                $table->enum('commission_scope', ['one_time', 'recurring'])->default('recurring');
                $table->enum('partner_tier', ['bronze', 'silver', 'gold'])->default('bronze');
                $table->enum('status', ['active', 'probation', 'inactive', 'terminated'])->default('active');

                // Dates
                $table->date('joining_date')->useCurrent();
                $table->date('contract_end_date')->nullable();

                // Banking & Remittance
                $table->string('bank_name')->nullable();
                $table->string('bank_account_name')->nullable();
                $table->string('bank_account_number')->nullable();
                $table->string('bank_ifsc')->nullable();
                $table->string('bank_upi_id')->nullable();

                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 2. Business Associate Payouts Ledger
        if (!Schema::hasTable('business_associate_payouts')) {
            Schema::create('business_associate_payouts', function (Blueprint $table) {
                $table->id();
                $table->string('payout_number')->unique(); // BA-PO-2026-001
                $table->foreignId('business_associate_id')->constrained('business_associates')->cascadeOnDelete();
                $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
                $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
                $table->foreignId('invoice_payment_id')->nullable()->constrained('invoice_payments')->nullOnDelete();

                $table->enum('type', ['salary', 'commission', 'bonus', 'reimbursement'])->default('commission');
                $table->string('period_month', 7)->nullable(); // YYYY-MM

                $table->decimal('gross_amount', 12, 2);
                $table->decimal('tds_rate', 5, 2)->default(5.00); // Section 194H (5% with PAN)
                $table->decimal('tds_amount', 12, 2)->default(0.00);
                $table->decimal('net_amount', 12, 2);

                $table->enum('status', ['pending', 'approved', 'paid', 'cancelled'])->default('pending');
                $table->enum('payment_method', ['bank_transfer', 'upi', 'cheque', 'cash'])->default('bank_transfer');
                $table->string('reference_number')->nullable(); // Bank UTR
                $table->timestamp('paid_at')->nullable();
                $table->text('notes')->nullable();

                $table->timestamps();
                $table->softDeletes();
            });
        }

        // 3. Business Associate Document Vault
        if (!Schema::hasTable('business_associate_documents')) {
            Schema::create('business_associate_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('business_associate_id')->constrained('business_associates')->cascadeOnDelete();
                $table->string('title');
                $table->string('document_type')->default('contract'); // contract, nda, pan, kyc, other
                $table->string('file_path');
                $table->string('file_size')->nullable();
                $table->date('expiry_date')->nullable();
                $table->timestamps();
            });
        }

        // 4. Client Attribution linking
        if (Schema::hasTable('clients') && !Schema::hasColumn('clients', 'business_associate_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->foreignId('business_associate_id')->nullable()->after('status')->constrained('business_associates')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('clients') && Schema::hasColumn('clients', 'business_associate_id')) {
            Schema::table('clients', function (Blueprint $table) {
                $table->dropForeign(['business_associate_id']);
                $table->dropColumn('business_associate_id');
            });
        }

        Schema::dropIfExists('business_associate_documents');
        Schema::dropIfExists('business_associate_payouts');
        Schema::dropIfExists('business_associates');
    }
};
