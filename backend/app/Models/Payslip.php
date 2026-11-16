<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_batch_id',
        'user_id',
        'payslip_number',
        'month',
        'year',
        'basic_salary',
        'hra',
        'allowances',
        'bonus',
        'gross_earnings',
        'pf_deduction',
        'pt_deduction',
        'tds_deduction',
        'lop_deduction',
        'total_deductions',
        'net_pay',
        'total_days',
        'paid_days',
        'lop_days',
        'payment_status',
        'payment_method',
        'transaction_reference',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
            'basic_salary' => 'decimal:2',
            'hra' => 'decimal:2',
            'allowances' => 'decimal:2',
            'bonus' => 'decimal:2',
            'gross_earnings' => 'decimal:2',
            'pf_deduction' => 'decimal:2',
            'pt_deduction' => 'decimal:2',
            'tds_deduction' => 'decimal:2',
            'lop_deduction' => 'decimal:2',
            'total_deductions' => 'decimal:2',
            'net_pay' => 'decimal:2',
            'total_days' => 'integer',
            'paid_days' => 'decimal:1',
            'lop_days' => 'decimal:1',
            'paid_at' => 'datetime',
        ];
    }

    protected $appends = [
        'net_salary',
        'gross_salary',
        'epf_deduction',
        'professional_tax',
        'working_days',
        'status',
        'disbursed_at',
        'payment_mode',
        'special_allowance',
        'conveyance',
        'other_deductions',
        'total_earnings',
        'formatted_month',
    ];

    public function getNetSalaryAttribute(): float
    {
        return (float) ($this->net_pay ?? 0);
    }

    public function getGrossSalaryAttribute(): float
    {
        return (float) ($this->gross_earnings ?? 0);
    }

    public function getEpfDeductionAttribute(): float
    {
        return (float) ($this->pf_deduction ?? 0);
    }

    public function getProfessionalTaxAttribute(): float
    {
        return (float) ($this->pt_deduction ?? 0);
    }

    public function getWorkingDaysAttribute(): int
    {
        return (int) ($this->total_days ?? 30);
    }

    public function getStatusAttribute(): string
    {
        return $this->payment_status === 'paid' ? 'disbursed' : 'generated';
    }

    public function getDisbursedAtAttribute(): ?string
    {
        return $this->paid_at ? $this->paid_at->toIso8601String() : null;
    }

    public function getPaymentModeAttribute(): ?string
    {
        return $this->payment_method;
    }

    public function getSpecialAllowanceAttribute(): float
    {
        return (float) ($this->allowances ?? 0);
    }

    public function getConveyanceAttribute(): float
    {
        return 0.00;
    }

    public function getOtherDeductionsAttribute(): float
    {
        return 0.00;
    }

    public function getTotalEarningsAttribute(): float
    {
        return (float) ($this->gross_earnings ?? 0);
    }

    public function getFormattedMonthAttribute(): string
    {
        return sprintf('%04d-%02d', $this->year, $this->month);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PayrollBatch::class, 'payroll_batch_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
