<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'module',
        'action',
        'slug',
        'name',
        'description',
    ];

    /**
     * Roles containing this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_has_permissions', 'permission_id', 'role_id');
    }

    /**
     * Users with direct permission overrides.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_has_permissions', 'permission_id', 'user_id')
            ->withPivot('is_granted');
    }
}
