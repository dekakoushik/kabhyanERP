<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalaryStructure extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ctc_annual',
        'basic_monthly',
        'hra_monthly',
        'special_allowance',
        'conveyance_allowance',
        'pf_employee',
        'professional_tax',
        'tds_monthly',
        'effective_from',
    ];

    protected function casts(): array
    {
        return [
            'ctc_annual' => 'decimal:2',
            'basic_monthly' => 'decimal:2',
            'hra_monthly' => 'decimal:2',
            'special_allowance' => 'decimal:2',
            'conveyance_allowance' => 'decimal:2',
            'pf_employee' => 'decimal:2',
            'professional_tax' => 'decimal:2',
            'tds_monthly' => 'decimal:2',
            'effective_from' => 'date',
        ];
    }

    protected $appends = [
        'gross_monthly',
        'total_deductions',
        'net_monthly',
        'special_allowance_monthly',
        'conveyance_monthly',
        'epf_employee',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getSpecialAllowanceMonthlyAttribute(): float
    {
        return (float) ($this->special_allowance ?? 0);
    }

    public function getConveyanceMonthlyAttribute(): float
    {
        return (float) ($this->conveyance_allowance ?? 0);
    }

    public function getEpfEmployeeAttribute(): float
    {
        return (float) ($this->pf_employee ?? 0);
    }

    /**
     * Compute total gross monthly pay.
     */
    public function getGrossMonthlyAttribute(): float
    {
        return (float) ($this->basic_monthly + $this->hra_monthly + $this->special_allowance + $this->conveyance_allowance);
    }

    /**
     * Compute total monthly statutory deductions.
     */
    public function getTotalDeductionsAttribute(): float
    {
        return (float) ($this->pf_employee + $this->professional_tax + $this->tds_monthly);
    }

    /**
     * Compute expected baseline net pay.
     */
    public function getNetMonthlyAttribute(): float
    {
        return max(0, $this->gross_monthly - $this->total_deductions);
    }
}
