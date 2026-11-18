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
        'tax_calculation_type',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'round_off',
        'discount_type',
        'discount_rate',
        'discount_amount',
        'total_amount',
        'paid_amount',
        'invoiced_amount',
        'remaining_amount',
        'notes',
        'terms_and_conditions',
        'bank_details',
    ];

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
            'paid_amount' => 'decimal:2',
            'invoiced_amount' => 'decimal:2',
            'remaining_amount' => 'decimal:2',
        ];
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
        return $this->hasMany(ProformaInvoiceItem::class);
    }

    public function taxInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'proforma_invoice_id');
    }

    public function receiptVouchers(): HasMany
    {
        return $this->hasMany(ReceiptVoucher::class);
    }

    /**
     * Synchronize and recalculate progressive billing progress against linked Tax Invoices and Receipt Vouchers.
     */
    public function syncInvoicedTotals(): void
    {
        $invoicedTotal = (float) $this->taxInvoices()->where('status', '!=', 'cancelled')->sum('total_amount');

        // Automatically associate any vouchers created against the linked estimate
        if ($this->estimate_id) {
            ReceiptVoucher::where('estimate_id', $this->estimate_id)
                ->where('status', '!=', 'cancelled')
                ->whereNull('proforma_invoice_id')
                ->update(['proforma_invoice_id' => $this->id]);
        }

        $directAdvance = (float) $this->receiptVouchers()->where('status', '!=', 'cancelled')->sum('amount_received');
        $estimateAdvance = 0.0;
        if ($this->estimate_id) {
            $estimateAdvance = (float) ReceiptVoucher::where('estimate_id', $this->estimate_id)
                ->where('status', '!=', 'cancelled')
                ->sum('amount_received');
        }
        $advanceTotal = max($directAdvance, $estimateAdvance);
        $total = (float) $this->total_amount;
        $remaining = max(0, $total - max($invoicedTotal, $advanceTotal));

        $status = $this->status;
        if (in_array($this->status, ['draft', 'cancelled'])) {
            $status = $this->status;
        } elseif ($invoicedTotal >= ($total - 0.01)) {
            $status = 'fully_invoiced';
        } elseif ($advanceTotal >= ($total - 0.01)) {
            $status = 'paid';
        } elseif ($invoicedTotal > 0.01) {
            $status = 'partially_invoiced';
        } elseif ($advanceTotal > 0.01) {
            $status = 'partially_paid';
        } else {
            $status = 'unpaid';
        }

        try {
            $updateData = [
                'status' => $status,
                'paid_amount' => $advanceTotal,
            ];
            if (\Illuminate\Support\Facades\Schema::hasColumn('proforma_invoices', 'invoiced_amount')) {
                $updateData['invoiced_amount'] = $invoicedTotal;
            }
            if (\Illuminate\Support\Facades\Schema::hasColumn('proforma_invoices', 'remaining_amount')) {
                $updateData['remaining_amount'] = $remaining;
            }
            $this->updateQuietly($updateData);
        } catch (\Throwable $e) {
            // Graceful fallback to legacy status values if PostgreSQL enum check constraint is still enforced
            try {
                $fallbackStatus = ($remaining <= 0.01 || $advanceTotal >= ($total - 0.01))
                    ? 'paid'
                    : (($invoicedTotal > 0 || $advanceTotal > 0) ? 'partially_paid' : 'unpaid');
                $fallbackData = [
                    'status' => $fallbackStatus,
                    'paid_amount' => $advanceTotal,
                ];
                if (\Illuminate\Support\Facades\Schema::hasColumn('proforma_invoices', 'invoiced_amount')) {
                    $fallbackData['invoiced_amount'] = $invoicedTotal;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('proforma_invoices', 'remaining_amount')) {
                    $fallbackData['remaining_amount'] = $remaining;
                }
                $this->updateQuietly($fallbackData);
            } catch (\Throwable $e2) {
                \Illuminate\Support\Facades\Log::warning("Could not sync invoiced totals for Proforma #{$this->id}: {$e2->getMessage()}");
            }
        }
    }

    /**
     * Dual-lookup route binding: allows finding by proforma_number (e.g. PI-2026-001) or numeric id.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        return $this->where(function ($query) use ($value) {
            $query->where('proforma_number', $value);
            if (is_numeric($value)) {
                $query->orWhere('id', (int) $value);
            }
        })->firstOrFail();
    }

    /**
     * Recalculate totals from items.
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

        $invoicedAmount = (float) ($this->invoiced_amount ?? 0);
        $remainingAmount = max(0, $total - $invoicedAmount);

        $this->update([
            'subtotal' => $subtotal,
            'discount_rate' => $discountRate,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'round_off' => $roundOff,
            'total_amount' => $total,
            'remaining_amount' => $remainingAmount,
        ]);
    }
}
