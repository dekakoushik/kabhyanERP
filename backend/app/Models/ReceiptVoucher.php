<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ReceiptVoucher extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'voucher_number',
        'estimate_id',
        'proforma_invoice_id',
        'project_id',
        'client_id',
        'created_by',
        'client_name',
        'client_company',
        'client_email',
        'client_phone',
        'client_address',
        'client_gstin',
        'voucher_date',
        'amount_received',
        'tax_calculation_type',
        'taxable_amount',
        'tax_rate',
        'tax_amount',
        'cgst_amount',
        'sgst_amount',
        'igst_amount',
        'is_inter_state',
        'place_of_supply',
        'payment_mode',
        'payment_reference',
        'status',
        'adjusted_amount',
        'remaining_advance',
        'notes',
    ];

    protected $casts = [
        'voucher_date' => 'date',
        'amount_received' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'igst_amount' => 'decimal:2',
        'adjusted_amount' => 'decimal:2',
        'remaining_advance' => 'decimal:2',
        'is_inter_state' => 'boolean',
    ];

    protected $appends = [
        'total_amount',
        'remaining_amount',
    ];

    public function getTotalAmountAttribute(): float
    {
        return (float) ($this->attributes['amount_received'] ?? 0);
    }

    public function getRemainingAmountAttribute(): float
    {
        return (float) ($this->attributes['remaining_advance'] ?? 0);
    }

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }

    public function proformaInvoice(): BelongsTo
    {
        return $this->belongsTo(ProformaInvoice::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(InvoiceAdvanceAdjustment::class);
    }

    public function invoiceAdvanceAdjustments(): HasMany
    {
        return $this->hasMany(InvoiceAdvanceAdjustment::class);
    }

    public function refundVouchers(): HasMany
    {
        return $this->hasMany(RefundVoucher::class);
    }

    /**
     * Recompute adjustment totals and advance status.
     */
    public function syncAdjustedTotals(): void
    {
        $totalAdjusted = (float) $this->adjustments()->sum('amount_adjusted');
        $totalRefunded = (float) $this->refundVouchers()->sum('refund_amount');
        $amount = (float) $this->amount_received;
        $remaining = max(0, $amount - $totalAdjusted - $totalRefunded);

        $status = 'active';
        if ($totalRefunded >= ($amount - 0.01)) {
            $status = 'refunded';
        } elseif ($remaining <= 0.01) {
            $status = 'adjusted';
        } elseif ($totalAdjusted > 0) {
            $status = 'partially_adjusted';
        }

        $this->updateQuietly([
            'adjusted_amount' => $totalAdjusted,
            'remaining_advance' => $remaining,
            'status' => $status,
        ]);
    }
}
