<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BusinessAssociateDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_associate_id',
        'title',
        'document_type',
        'file_path',
        'file_size',
        'expiry_date',
    ];

    protected $casts = [
        'expiry_date' => 'date',
    ];

    public function associate(): BelongsTo
    {
        return $this->belongsTo(BusinessAssociate::class, 'business_associate_id');
    }
}
