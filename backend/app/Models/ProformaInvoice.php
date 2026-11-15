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
        'round_off',
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

    /**
     * Synchronize and recalculate progressive billing progress against linked Tax Invoices.
     */
    public function syncInvoicedTotals(): void
    {
        $invoicedTotal = (float) $this->taxInvoices()->where('status', '!=', 'cancelled')->sum('total_amount');
        $total = (float) $this->total_amount;
        $remaining = max(0, $total - $invoicedTotal);

        $status = $this->status;
        if ($invoicedTotal <= 0) {
            $status = in_array($this->status, ['draft', 'cancelled']) ? $this->status : 'unpaid';
        } elseif ($remaining <= 0.01) {
            $status = 'fully_invoiced';
        } else {
            $status = 'partially_invoiced';
        }

        $this->updateQuietly([
            'invoiced_amount' => $invoicedTotal,
            'remaining_amount' => $remaining,
            'status' => $status,
        ]);
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
        $discountAmount = ($subtotal * ((float) ($this->discount_rate ?? 0))) / 100;
        $taxableAmount = max(0, $subtotal - $discountAmount);
        $taxAmount = ($taxableAmount * ((float) ($this->tax_rate ?? 0))) / 100;
        $roundOff = (float) ($this->round_off ?? 0);
        $total = $taxableAmount + $taxAmount + $roundOff;

        $invoicedAmount = (float) ($this->invoiced_amount ?? 0);
        $remainingAmount = max(0, $total - $invoicedAmount);

        $this->update([
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'round_off' => $roundOff,
            'total_amount' => $total,
            'remaining_amount' => $remainingAmount,
        ]);
    }
}
