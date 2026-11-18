<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'client_code',
        'name',
        'company_name',
        'email',
        'phone',
        'gstin',
        'pan',
        'address',
        'city',
        'state',
        'country',
        'postal_code',
        'currency',
        'payment_terms',
        'portal_access_status',
        'business_associate_id',
        'notes',
    ];

    protected $appends = [
        'has_password_set',
        'password_set_at',
    ];

    public function getHasPasswordSetAttribute(): bool
    {
        $user = $this->relationLoaded('user') ? $this->user : $this->user()->first();
        if (!$user && $this->email) {
            $user = User::where('email', $this->email)->first();
        }
        return (bool) ($user && $user->password_set_at !== null);
    }

    public function getPasswordSetAtAttribute(): ?string
    {
        $user = $this->relationLoaded('user') ? $this->user : $this->user()->first();
        if (!$user && $this->email) {
            $user = User::where('email', $this->email)->first();
        }
        return $user?->password_set_at?->toIso8601String();
    }

    public function businessAssociate()
    {
        return $this->belongsTo(BusinessAssociate::class, 'business_associate_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'client_email', 'email');
    }

    public function estimates()
    {
        return $this->hasMany(Estimate::class, 'client_email', 'email');
    }
}

