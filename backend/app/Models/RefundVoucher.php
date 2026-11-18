<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundVoucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'voucher_number',
        'receipt_voucher_id',
        'client_id',
        'created_by',
        'voucher_date',
        'refund_amount',
        'taxable_amount',
        'tax_rate',
        'tax_amount',
        'cgst_amount',
        'sgst_amount',
        'igst_amount',
        'refund_mode',
        'refund_reference',
        'reason',
        'notes',
    ];

    protected $casts = [
        'voucher_date' => 'date',
        'refund_amount' => 'decimal:2',
        'taxable_amount' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'cgst_amount' => 'decimal:2',
        'sgst_amount' => 'decimal:2',
        'igst_amount' => 'decimal:2',
    ];

    public function receiptVoucher(): BelongsTo
    {
        return $this->belongsTo(ReceiptVoucher::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
