<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number',
        'proforma_invoice_id',
        'estimate_id',
        'project_id',
        'created_by',
        'client_name',
        'client_company',
        'client_email',
        'client_phone',
        'client_address',
        'client_gstin',
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
        'due_amount',
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
        'due_amount' => 'decimal:2',
    ];

    public function proformaInvoice(): BelongsTo
    {
        return $this->belongsTo(ProformaInvoice::class);
    }

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
        return $this->hasMany(InvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    /**
     * Compute subtotal, taxes, discounts, and payment balances.
     */
    public function recalculateTotals(): void
    {
        $subtotal = (float) $this->items()->sum('amount');
        $discountAmount = ($subtotal * ((float) $this->discount_rate ?? 0)) / 100;
        $taxableAmount = max(0, $subtotal - $discountAmount);
        $taxAmount = ($taxableAmount * ((float) $this->tax_rate ?? 0)) / 100;
        $total = $taxableAmount + $taxAmount;

        $paid = (float) $this->payments()->sum('amount');
        $due = max(0, $total - $paid);

        $status = $this->status;
        if ($paid >= $total && $total > 0) {
            $status = 'paid';
        } elseif ($paid > 0 && $paid < $total) {
            $status = 'partially_paid';
        } elseif ($paid == 0 && $status !== 'cancelled') {
            $status = ($this->due_date && $this->due_date->isPast()) ? 'overdue' : 'unpaid';
        }

        $this->update([
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'total_amount' => $total,
            'paid_amount' => $paid,
            'due_amount' => $due,
            'status' => $status,
        ]);
    }
}
