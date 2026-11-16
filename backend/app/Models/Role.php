<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'color',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'is_system' => 'boolean',
        ];
    }

    /**
     * Permissions assigned to this role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_has_permissions', 'role_id', 'permission_id');
    }

    /**
     * Users holding this role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if the role possesses a specific permission slug.
     */
    public function hasPermission(string $slug): bool
    {
        return $this->permissions->contains('slug', $slug);
    }

    /**
     * Sync permissions for this role.
     *
     * @param array<int|string> $permissions Array of permission IDs or slugs
     */
    public function syncPermissions(array $permissions): void
    {
        if (empty($permissions)) {
            $this->permissions()->detach();
            return;
        }

        // Check if array has string slugs or IDs
        if (is_string(reset($permissions))) {
            $ids = Permission::whereIn('slug', $permissions)->pluck('id')->toArray();
        } else {
            $ids = $permissions;
        }

        $this->permissions()->sync($ids);
    }
}
