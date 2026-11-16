<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'employee_code',
        'name',
        'email',
        'phone',
        'emergency_contact',
        'role',
        'role_id',
        'department',
        'designation',
        'date_of_joining',
        'status',
        'password',
        'last_login_at',
        'last_login_ip',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'date_of_joining' => 'date',
            'password' => 'hashed',
        ];
    }

    /**
     * Custom role assigned to this staff member.
     */
    public function customRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Current active salary structure (compensation breakdown).
     */
    public function salaryStructure(): HasOne
    {
        return $this->hasOne(SalaryStructure::class);
    }

    /**
     * Leave applications submitted by this employee.
     */
    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    /**
     * Monthly attendance and working days ledgers.
     */
    public function monthlyAttendances(): HasMany
    {
        return $this->hasMany(MonthlyAttendance::class);
    }

    /**
     * Daily attendance logs and mobile punches.
     */
    public function dailyAttendances(): HasMany
    {
        return $this->hasMany(DailyAttendance::class);
    }

    /**
     * Official payslips generated for this employee.
     */
    public function payslips(): HasMany
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * Direct permission overrides on this user.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_has_permissions', 'user_id', 'permission_id')
            ->withPivot('is_granted');
    }

    /**
     * Check if user is SuperAdmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin' || ($this->customRole && $this->customRole->slug === 'superadmin');
    }

    /**
     * Check if user has active status.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Determine if staff member holds a given permission.
     */
    public function hasPermission(string $slug): bool
    {
        // 1. SuperAdmins possess unrestricted system authority
        if ($this->isSuperAdmin()) {
            return true;
        }

        // 2. External clients have no internal staff permissions
        if ($this->role === 'client') {
            return false;
        }

        // 3. Check direct user-level permission override
        $override = $this->permissions()->where('slug', $slug)->first();
        if ($override) {
            return (bool) $override->pivot->is_granted;
        }

        // 4. Check custom role permissions if assigned
        if ($this->customRole) {
            return $this->customRole->hasPermission($slug);
        }

        // 5. Fallback: Role-based default permission mapping
        return $this->hasRoleDefaultPermission($this->role, $slug);
    }

    /**
     * Check if user has any of the specified permissions.
     */
    public function hasAnyPermission(array $slugs): bool
    {
        foreach ($slugs as $slug) {
            if ($this->hasPermission($slug)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Collect all effective permission slugs for the authenticated user session.
     *
     * @return list<string>
     */
    public function getAllEffectivePermissions(): array
    {
        if ($this->isSuperAdmin()) {
            return Permission::pluck('slug')->toArray();
        }

        if ($this->role === 'client') {
            return [];
        }

        $perms = [];

        // Add from custom role
        if ($this->customRole) {
            $perms = $this->customRole->permissions->pluck('slug')->toArray();
        } else {
            $allPerms = Permission::all();
            foreach ($allPerms as $p) {
                if ($this->hasRoleDefaultPermission($this->role, $p->slug)) {
                    $perms[] = $p->slug;
                }
            }
        }

        // Apply direct overrides
        foreach ($this->permissions as $override) {
            if ($override->pivot->is_granted) {
                if (!in_array($override->slug, $perms)) {
                    $perms[] = $override->slug;
                }
            } else {
                $perms = array_values(array_diff($perms, [$override->slug]));
            }
        }

        return $perms;
    }

    /**
     * Built-in fallback baseline permissions for standard legacy roles.
     */
    protected function hasRoleDefaultPermission(?string $role, string $slug): bool
    {
        if (!$role) return false;

        $adminPerms = [
            'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.delete', 'estimates.convert_to_proforma', 'estimates.export_pdf',
            'proforma.view', 'proforma.create', 'proforma.edit', 'proforma.delete', 'proforma.convert_to_invoice', 'proforma.export_pdf',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.delete', 'invoices.record_payment', 'invoices.export_pdf',
            'accounts.view', 'accounts.export_reports',
            'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete', 'expenses.manage_categories',
            'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 'clients.manage_portal_access',
            'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.manage_members',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.update_status',
            'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.assign', 'tickets.change_status',
            'staff.view', 'staff.create', 'staff.edit', 'staff.suspend', 'staff.delete',
            'roles.view', 'roles.manage',
            'settings.view', 'settings.manage_company', 'settings.manage_taxation', 'settings.flush_cache',
        ];

        $managerPerms = [
            'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.convert_to_proforma', 'estimates.export_pdf',
            'proforma.view', 'proforma.create', 'proforma.edit', 'proforma.convert_to_invoice', 'proforma.export_pdf',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.record_payment', 'invoices.export_pdf',
            'expenses.view', 'expenses.create', 'expenses.edit',
            'clients.view', 'clients.create', 'clients.edit',
            'projects.view', 'projects.create', 'projects.edit', 'projects.manage_members',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.update_status',
            'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.assign', 'tickets.change_status',
        ];

        $hrPerms = [
            'staff.view', 'staff.create', 'staff.edit',
            'expenses.view', 'expenses.create',
            'estimates.view', 'estimates.create',
            'projects.view', 'tasks.view', 'tickets.view', 'tickets.reply',
        ];

        $employeePerms = [
            'projects.view',
            'tasks.view', 'tasks.update_status',
            'tickets.view', 'tickets.create', 'tickets.reply',
        ];

        return match ($role) {
            'superadmin' => true,
            'admin' => in_array($slug, $adminPerms),
            'manager' => in_array($slug, $managerPerms),
            'hr' => in_array($slug, $hrPerms),
            'employee' => in_array($slug, $employeePerms),
            default => false,
        };
    }
}
