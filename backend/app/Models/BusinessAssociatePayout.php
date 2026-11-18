<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessAssociatePayout extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'payout_number',
        'business_associate_id',
        'client_id',
        'invoice_id',
        'invoice_payment_id',
        'type',
        'period_month',
        'gross_amount',
        'tds_rate',
        'tds_amount',
        'net_amount',
        'status',
        'payment_method',
        'reference_number',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'gross_amount' => 'decimal:2',
        'tds_rate' => 'decimal:2',
        'tds_amount' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    public function associate(): BelongsTo
    {
        return $this->belongsTo(BusinessAssociate::class, 'business_associate_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(InvoicePayment::class, 'invoice_payment_id');
    }

    /**
     * Generate sequential payout number e.g. BA-PO-2026-001.
     */
    public static function generateNextPayoutNumber(): string
    {
        $year = date('Y');
        $prefix = "BA-PO-{$year}-";

        $lastRecord = self::withTrashed()
            ->where('payout_number', 'like', "{$prefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if (!$lastRecord) {
            return "{$prefix}001";
        }

        if (preg_match('/-(\d+)$/', $lastRecord->payout_number, $matches)) {
            $nextNum = intval($matches[1]) + 1;
            return sprintf('%s%03d', $prefix, $nextNum);
        }

        $count = self::withTrashed()->count() + 1;
        return sprintf('%s%03d', $prefix, $count);
    }
}
