<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_number',
        'month',
        'year',
        'total_gross',
        'total_deductions',
        'total_net',
        'staff_count',
        'status',
        'finalized_at',
        'finalized_by',
    ];

    protected function casts(): array
    {
        return [
            'month' => 'integer',
            'year' => 'integer',
            'total_gross' => 'decimal:2',
            'total_deductions' => 'decimal:2',
            'total_net' => 'decimal:2',
            'staff_count' => 'integer',
            'finalized_at' => 'datetime',
        ];
    }

    protected $appends = [
        'formatted_month',
        'payslips_count',
        'total_lop_deductions',
        'disbursed_at',
    ];

    public function getFormattedMonthAttribute(): string
    {
        return sprintf('%04d-%02d', $this->year, $this->month);
    }

    public function getPayslipsCountAttribute(): int
    {
        return (int) $this->payslips()->count();
    }

    public function getTotalLopDeductionsAttribute(): float
    {
        return (float) $this->payslips()->sum('lop_deduction');
    }

    public function getDisbursedAtAttribute(): ?string
    {
        return $this->status === 'paid' && $this->updated_at ? $this->updated_at->toIso8601String() : null;
    }

    public function finalizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }
}
