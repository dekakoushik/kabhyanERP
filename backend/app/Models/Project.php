<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'client_id',
        'client_name',
        'manager_id',
        'status',
        'priority',
        'budget',
        'start_date',
        'deadline',
        'progress_percentage',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'start_date' => 'date',
        'deadline' => 'date',
        'progress_percentage' => 'integer',
    ];

    /**
     * Project Manager relationship.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Assigned team members.
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role_in_project')
            ->withTimestamps();
    }

    /**
     * Project Tasks.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Client relationship.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Recalculate progress percentage based on completed tasks.
     */
    public function recalculateProgress(): void
    {
        $total = $this->tasks()->count();
        if ($total === 0) {
            $this->update(['progress_percentage' => 0]);
            return;
        }

        $completed = $this->tasks()->where('status', 'completed')->count();
        $percentage = (int) round(($completed / $total) * 100);

        $this->update(['progress_percentage' => $percentage]);
    }
}
