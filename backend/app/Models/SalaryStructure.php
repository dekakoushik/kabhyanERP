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
        'city_tier',
        'basic_monthly',
        'hra_monthly',
        'has_hra',
        'special_allowance',
        'has_special_allowance',
        'conveyance_allowance',
        'has_conveyance',
        'pf_employee',
        'has_epf',
        'epf_mode',
        'epf_employer',
        'has_esi',
        'esi_employee',
        'esi_employer',
        'professional_tax',
        'has_professional_tax',
        'pt_state',
        'has_gratuity',
        'gratuity_monthly',
        'tds_monthly',
        'has_tds',
        'tax_regime',
        'effective_from',
    ];

    protected function casts(): array
    {
        return [
            'ctc_annual' => 'decimal:2',
            'basic_monthly' => 'decimal:2',
            'hra_monthly' => 'decimal:2',
            'has_hra' => 'boolean',
            'special_allowance' => 'decimal:2',
            'has_special_allowance' => 'boolean',
            'conveyance_allowance' => 'decimal:2',
            'has_conveyance' => 'boolean',
            'pf_employee' => 'decimal:2',
            'has_epf' => 'boolean',
            'epf_employer' => 'decimal:2',
            'has_esi' => 'boolean',
            'esi_employee' => 'decimal:2',
            'esi_employer' => 'decimal:2',
            'professional_tax' => 'decimal:2',
            'has_professional_tax' => 'boolean',
            'has_gratuity' => 'boolean',
            'gratuity_monthly' => 'decimal:2',
            'tds_monthly' => 'decimal:2',
            'has_tds' => 'boolean',
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
        'total_employer_cost',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getSpecialAllowanceMonthlyAttribute(): float
    {
        return ($this->has_special_allowance ?? true) ? (float) ($this->special_allowance ?? 0) : 0.0;
    }

    public function getConveyanceMonthlyAttribute(): float
    {
        return ($this->has_conveyance ?? true) ? (float) ($this->conveyance_allowance ?? 0) : 0.0;
    }

    public function getEpfEmployeeAttribute(): float
    {
        return ($this->has_epf ?? true) ? (float) ($this->pf_employee ?? 0) : 0.0;
    }

    /**
     * Compute total gross monthly pay respecting active earnings toggles.
     */
    public function getGrossMonthlyAttribute(): float
    {
        $basic = (float) $this->basic_monthly;
        $hra = ($this->has_hra ?? true) ? (float) $this->hra_monthly : 0.0;
        $special = ($this->has_special_allowance ?? true) ? (float) $this->special_allowance : 0.0;
        $conveyance = ($this->has_conveyance ?? true) ? (float) $this->conveyance_allowance : 0.0;

        return round($basic + $hra + $special + $conveyance, 2);
    }

    /**
     * Compute total monthly employee statutory deductions respecting active deduction toggles.
     */
    public function getTotalDeductionsAttribute(): float
    {
        $epf = ($this->has_epf ?? true) ? (float) $this->pf_employee : 0.0;
        $esi = ($this->has_esi ?? false) ? (float) ($this->esi_employee ?? 0) : 0.0;
        $pt = ($this->has_professional_tax ?? true) ? (float) $this->professional_tax : 0.0;
        $tds = ($this->has_tds ?? false) ? (float) $this->tds_monthly : 0.0;

        return round($epf + $esi + $pt + $tds, 2);
    }

    /**
     * Compute expected baseline net in-hand take-home pay.
     */
    public function getNetMonthlyAttribute(): float
    {
        return max(0, round($this->gross_monthly - $this->total_deductions, 2));
    }

    /**
     * Compute total monthly employer cost to company (CTC).
     */
    public function getTotalEmployerCostAttribute(): float
    {
        $epfEmployer = ($this->has_epf ?? true) ? (float) ($this->epf_employer ?? $this->pf_employee) : 0.0;
        $esiEmployer = ($this->has_esi ?? false) ? (float) ($this->esi_employer ?? 0) : 0.0;
        $gratuity = ($this->has_gratuity ?? true) ? (float) ($this->gratuity_monthly ?? round((15 / 26) * ($this->basic_monthly / 12), 2)) : 0.0;

        return round($this->gross_monthly + $epfEmployer + $esiEmployer + $gratuity, 2);
    }
}
