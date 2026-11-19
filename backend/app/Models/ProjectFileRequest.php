<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProjectFileRequest extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_id',
        'client_id',
        'requested_by',
        'title',
        'description',
        'file_type_allowed',
        'due_date',
        'priority',
        'status',
        'file_path',
        'file_name',
        'file_size',
        'mime_type',
        'uploaded_at',
        'review_notes',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'uploaded_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'file_size' => 'integer',
        ];
    }

    /**
     * Parent Project.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Target Client.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Project Manager who made the request.
     */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Reviewer (PM / Admin).
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
