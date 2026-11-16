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

    public function batch(): BelongsTo
    {
        return $this->belongsTo(PayrollBatch::class, 'payroll_batch_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
