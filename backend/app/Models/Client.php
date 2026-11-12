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
        'notes',
    ];

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

