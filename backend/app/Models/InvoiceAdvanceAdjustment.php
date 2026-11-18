<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceAdvanceAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'receipt_voucher_id',
        'amount_adjusted',
    ];

    protected $casts = [
        'amount_adjusted' => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function receiptVoucher(): BelongsTo
    {
        return $this->belongsTo(ReceiptVoucher::class);
    }
}
