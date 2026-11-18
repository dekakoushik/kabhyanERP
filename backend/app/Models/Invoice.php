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
        'tax_calculation_type',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'round_off',
        'discount_type',
        'discount_rate',
        'discount_amount',
        'total_amount',
        'advance_adjusted',
        'paid_amount',
        'due_amount',
        'cashfree_link_id',
        'cashfree_link_url',
        'cashfree_link_qrcode',
        'notes',
        'terms_and_conditions',
        'bank_details',
    ];

    protected static function booted(): void
    {
        static::saved(function (Invoice $invoice) {
            if ($invoice->proforma_invoice_id) {
                $invoice->proformaInvoice?->syncInvoicedTotals();
            }
        });

        static::deleted(function (Invoice $invoice) {
            if ($invoice->proforma_invoice_id) {
                $invoice->proformaInvoice?->syncInvoicedTotals();
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'round_off' => 'decimal:2',
            'discount_rate' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'advance_adjusted' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'due_amount' => 'decimal:2',
        ];
    }

    public function advanceAdjustments(): HasMany
    {
        return $this->hasMany(InvoiceAdvanceAdjustment::class);
    }

    public function receiptVouchers()
    {
        return $this->belongsToMany(ReceiptVoucher::class, 'invoice_advance_adjustments')->withPivot('amount_adjusted');
    }

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
     * Dual-lookup route binding: allows finding by invoice_number (e.g. INV-2026-081) or numeric id.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where(function ($query) use ($value) {
            $query->where('invoice_number', $value);
            if (is_numeric($value)) {
                $query->orWhere('id', (int) $value);
            }
        })->firstOrFail();
    }

    /**
     * Compute subtotal, taxes, discounts, and payment balances.
     */
    public function recalculateTotals(): void
    {
        $subtotal = (float) $this->items()->sum('amount');
        $taxCalculationType = $this->tax_calculation_type ?? 'exclusive';
        $discountType = $this->discount_type ?? 'percentage';

        // 1. Calculate discount
        if ($discountType === 'fixed') {
            $discountAmount = min((float) ($this->discount_amount ?? 0), $subtotal);
            $discountRate = $subtotal > 0 ? round(($discountAmount / $subtotal) * 100, 2) : 0;
        } else {
            $discountRate = (float) ($this->discount_rate ?? 0);
            $discountAmount = round(($subtotal * $discountRate) / 100, 2);
        }

        $grossAfterDiscount = max(0, $subtotal - $discountAmount);
        $taxRate = (float) ($this->tax_rate ?? 0);

        // 2. Calculate tax based on mode and per-item tax rates
        $items = $this->items()->get();
        $hasCustomItemTaxes = $items->contains(function ($item) {
            return $item->tax_rate !== null;
        });

        if ($hasCustomItemTaxes && $items->isNotEmpty()) {
            $totalTaxable = 0;
            $totalTax = 0;
            $discountFactor = $subtotal > 0 ? max(0, ($subtotal - $discountAmount) / $subtotal) : 1;

            foreach ($items as $item) {
                $itemAmt = (float) $item->amount;
                $itemDiscounted = $itemAmt * $discountFactor;
                $itemRate = $item->tax_rate !== null ? (float) $item->tax_rate : $taxRate;

                if ($taxCalculationType === 'inclusive') {
                    $itemTaxable = $itemRate > 0 ? round($itemDiscounted / (1 + ($itemRate / 100)), 2) : $itemDiscounted;
                    $itemTax = round($itemDiscounted - $itemTaxable, 2);
                } else {
                    $itemTaxable = $itemDiscounted;
                    $itemTax = round(($itemTaxable * $itemRate) / 100, 2);
                }

                $item->updateQuietly([
                    'tax_rate' => $itemRate,
                    'tax_amount' => $itemTax,
                ]);

                $totalTaxable += $itemTaxable;
                $totalTax += $itemTax;
            }

            $taxableAmount = round($totalTaxable, 2);
            $taxAmount = round($totalTax, 2);
            $rawTotal = $taxCalculationType === 'inclusive' ? $grossAfterDiscount : ($taxableAmount + $taxAmount);
        } elseif ($taxCalculationType === 'inclusive') {
            $taxableAmount = $taxRate > 0 ? round($grossAfterDiscount / (1 + ($taxRate / 100)), 2) : $grossAfterDiscount;
            $taxAmount = round($grossAfterDiscount - $taxableAmount, 2);
            $rawTotal = $grossAfterDiscount;
        } else {
            $taxableAmount = $grossAfterDiscount;
            $taxAmount = round(($taxableAmount * $taxRate) / 100, 2);
            $rawTotal = $taxableAmount + $taxAmount;
        }

        $roundOff = (float) ($this->round_off ?? 0);
        $total = max(0, $rawTotal + $roundOff);

        $advanceAdjusted = (float) ($this->advance_adjusted ?? 0);
        $paid = (float) $this->payments()->sum('amount');
        $due = max(0, $total - $advanceAdjusted - $paid);

        $status = $this->status;
        if (($paid + $advanceAdjusted) >= $total && $total > 0) {
            $status = 'paid';
        } elseif (($paid + $advanceAdjusted) > 0 && ($paid + $advanceAdjusted) < $total) {
            $status = 'partially_paid';
        } elseif (($paid + $advanceAdjusted) == 0 && $status !== 'cancelled') {
            $status = ($this->due_date && $this->due_date->isPast()) ? 'overdue' : 'unpaid';
        }

        $this->update([
            'subtotal' => $subtotal,
            'discount_rate' => $discountRate,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'round_off' => $roundOff,
            'total_amount' => $total,
            'advance_adjusted' => $advanceAdjusted,
            'paid_amount' => $paid,
            'due_amount' => $due,
            'status' => $status,
        ]);
    }
}
