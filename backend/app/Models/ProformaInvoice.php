<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProformaInvoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'proforma_number',
        'estimate_id',
        'project_id',
        'created_by',
        'client_name',
        'client_company',
        'client_email',
        'client_phone',
        'client_address',
        'invoice_date',
        'due_date',
        'status',
        'currency',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'discount_rate',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'notes',
        'terms_and_conditions',
        'bank_details',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'due_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function estimate(): BelongsTo
    {
        return $this->belongsTo(Estimate::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProformaInvoiceItem::class);
    }

    /**
     * Recalculate totals from items.
     */
    public function recalculateTotals(): void
    {
        $subtotal = $this->items()->sum('amount');
        $discountAmount = ($subtotal * ($this->discount_rate ?? 0)) / 100;
        $taxableAmount = max(0, $subtotal - $discountAmount);
        $taxAmount = ($taxableAmount * ($this->tax_rate ?? 0)) / 100;
        $total = $taxableAmount + $taxAmount;

        $this->update([
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $total,
        ]);
    }
}
