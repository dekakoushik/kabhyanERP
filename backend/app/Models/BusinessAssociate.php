<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class BusinessAssociate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'associate_code',
        'name',
        'email',
        'phone',
        'emergency_contact',
        'address',
        'city',
        'state',
        'pincode',
        'pan_number',
        'gstin',
        'engagement_model',
        'base_salary',
        'commission_rate',
        'commission_basis',
        'commission_scope',
        'partner_tier',
        'status',
        'joining_date',
        'contract_end_date',
        'bank_name',
        'bank_account_name',
        'bank_account_number',
        'bank_ifsc',
        'bank_upi_id',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'base_salary' => 'decimal:2',
        'commission_rate' => 'decimal:2',
        'joining_date' => 'date',
        'contract_end_date' => 'date',
    ];

    /**
     * Clients referred by this business associate.
     */
    public function clients(): HasMany
    {
        return $this->hasMany(Client::class, 'business_associate_id');
    }

    /**
     * All earnings & payouts disbursed or pending for this associate.
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(BusinessAssociatePayout::class, 'business_associate_id');
    }

    /**
     * Documents and agreements uploaded for this associate.
     */
    public function documents(): HasMany
    {
        return $this->hasMany(BusinessAssociateDocument::class, 'business_associate_id');
    }

    /**
     * Staff user who onboarded this associate.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate the next sequential Associate Code (e.g. BA-001, BA-002).
     */
    public static function generateNextCode(): string
    {
        $lastRecord = self::withTrashed()
            ->where('associate_code', 'like', 'BA-%')
            ->orderBy('id', 'desc')
            ->first();

        if (!$lastRecord) {
            return 'BA-001';
        }

        if (preg_match('/BA-(\d+)/', $lastRecord->associate_code, $matches)) {
            $nextNum = intval($matches[1]) + 1;
            return sprintf('BA-%03d', $nextNum);
        }

        $count = self::withTrashed()->count() + 1;
        return sprintf('BA-%03d', $count);
    }

    /**
     * Recalculate and update the partner tier based on cumulative client billing.
     */
    public function syncPartnerTier(): string
    {
        $totalSales = DB::table('invoices')
            ->join('clients', 'invoices.client_id', '=', 'clients.id')
            ->where('clients.business_associate_id', $this->id)
            ->where('invoices.status', 'paid')
            ->sum('invoices.total');

        $tier = 'bronze';
        if ($totalSales >= 2000000) {
            $tier = 'gold';
        } elseif ($totalSales >= 500000) {
            $tier = 'silver';
        }

        if ($this->partner_tier !== $tier) {
            $this->update(['partner_tier' => $tier]);
        }

        return $tier;
    }
}
