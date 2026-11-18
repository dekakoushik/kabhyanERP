<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Services\MailNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Display a listing of staff users with search, role, status filtering and pagination.
     * Excludes external client portal accounts by default to maintain strict separation.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['customRole:id,name,slug,color,is_system']);

        // By default, staff directory displays internal staff only
        if ($request->boolean('include_clients', false) || $request->input('role') === 'client') {
            if ($request->input('role') === 'client') {
                $query->where('role', 'client');
            }
        } else {
            $query->where('role', '!=', 'client');
        }

        // Search by name, email, phone, employee code, designation, department
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('employee_code', 'like', "%{$search}%")
                  ->orWhere('designation', 'like', "%{$search}%")
                  ->orWhere('department', 'like', "%{$search}%");
            });
        }

        // Filter by role slug or role_id
        if ($roleId = $request->input('role_id')) {
            $query->where('role_id', $roleId);
        } elseif ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by department
        if ($dept = $request->input('department')) {
            $query->where('department', $dept);
        }

        $perPage = (int) $request->input('per_page', 15);
        $users = $query->latest('id')->paginate($perPage);

        // Stats summary for staff
        $staffBase = User::where('role', '!=', 'client');
        $stats = [
            'total_users' => (clone $staffBase)->count(),
            'active_users' => (clone $staffBase)->where('status', 'active')->count(),
            'inactive_users' => (clone $staffBase)->where('status', 'inactive')->count(),
            'suspended_users' => (clone $staffBase)->where('status', 'suspended')->count(),
            'superadmins' => (clone $staffBase)->where('role', 'superadmin')->count(),
            'admins' => (clone $staffBase)->where('role', 'admin')->count(),
            'managers' => (clone $staffBase)->where('role', 'manager')->count(),
            'hr' => (clone $staffBase)->where('role', 'hr')->count(),
            'employees' => (clone $staffBase)->where('role', 'employee')->count(),
            'custom_role_users' => (clone $staffBase)->whereNotNull('role_id')->whereHas('customRole', fn ($q) => $q->where('is_system', false))->count(),
        ];

        return response()->json([
            'users' => $users,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact' => ['nullable', 'string', 'max:100'],
            'employee_code' => ['nullable', 'string', 'max:50', 'unique:users,employee_code'],
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'date_of_joining' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['required', 'string', Password::min(8)],
            'permissions' => ['nullable', 'array'],
            'permissions.*.id' => ['nullable', 'exists:permissions,id'],
            'permissions.*.slug' => ['nullable', 'string'],
            'permissions.*.is_granted' => ['required', 'boolean'],
        ]);

        // Resolve role slug and role_id
        $roleId = $validated['role_id'] ?? null;
        $roleSlug = $validated['role'] ?? 'employee';

        if ($roleId) {
            $roleModel = Role::find($roleId);
            if ($roleModel) {
                $roleSlug = $roleModel->slug;
            }
        } else {
            $roleModel = Role::where('slug', $roleSlug)->first();
            if ($roleModel) {
                $roleId = $roleModel->id;
            }
        }

        // Auto-generate sequential employee code if missing
        $employeeCode = $validated['employee_code'] ?? null;
        if (empty($employeeCode)) {
            $employeeCode = $this->generateNextEmployeeCode();
        }

        $user = DB::transaction(function () use ($validated, $roleId, $roleSlug, $employeeCode) {
            $newUser = User::create([
                'employee_code' => $employeeCode,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'role' => $roleSlug,
                'role_id' => $roleId,
                'department' => $validated['department'] ?? 'General',
                'designation' => $validated['designation'] ?? 'Team Member',
                'date_of_joining' => $validated['date_of_joining'] ?? now()->toDateString(),
                'status' => $validated['status'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(),
            ]);

            // Sync direct permission overrides if provided
            if (!empty($validated['permissions'])) {
                foreach ($validated['permissions'] as $perm) {
                    $pId = $perm['id'] ?? null;
                    if (!$pId && !empty($perm['slug'])) {
                        $pId = Permission::where('slug', $perm['slug'])->value('id');
                    }
                    if ($pId) {
                        $newUser->permissions()->syncWithoutDetaching([
                            $pId => ['is_granted' => $perm['is_granted']],
                        ]);
                    }
                }
            }

            return $newUser;
        });

        try {
            MailNotificationService::sendUserWelcome($user, $validated['password']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send staff onboarding email: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Staff member onboarded successfully',
            'user' => $user->fresh()->load('customRole:id,name,slug,color,is_system'),
        ], 201);
    }

    /**
     * Display the specified user profile dossier with project assignments and permissions.
     */
    public function show(User $user): JsonResponse
    {
        $user->load([
            'customRole.permissions:id,module,action,slug,name',
            'permissions:id,module,action,slug,name',
        ]);

        // Get projects where user is manager or member
        $managedProjects = \App\Models\Project::where('manager_id', $user->id)
            ->select('id', 'name', 'code', 'status', 'progress_percentage', 'deadline')
            ->limit(10)
            ->get();

        $memberProjects = $user->belongsToMany(\App\Models\Project::class, 'project_members', 'user_id', 'project_id')
            ->select('projects.id', 'projects.name', 'projects.code', 'projects.status', 'projects.progress_percentage', 'projects.deadline')
            ->limit(10)
            ->get();

        // Get recent tasks
        $tasks = \App\Models\Task::where('assigned_to', $user->id)
            ->with('project:id,name,code')
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'user' => $user,
            'effective_permissions' => $user->getAllEffectivePermissions(),
            'managed_projects' => $managedProjects,
            'member_projects' => $memberProjects,
            'tasks' => $tasks,
            'tasks_count' => \App\Models\Task::where('assigned_to', $user->id)->count(),
            'completed_tasks_count' => \App\Models\Task::where('assigned_to', $user->id)->where('status', 'completed')->count(),
        ]);
    }

    /**
     * Update the specified staff member.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)->whereNull('deleted_at')],
            'phone' => ['nullable', 'string', 'max:20'],
            'emergency_contact' => ['nullable', 'string', 'max:100'],
            'employee_code' => ['nullable', 'string', 'max:50', Rule::unique('users', 'employee_code')->ignore($user->id)],
            'role_id' => ['nullable', 'exists:roles,id'],
            'role' => ['nullable', 'string', 'max:50'],
            'department' => ['nullable', 'string', 'max:100'],
            'designation' => ['nullable', 'string', 'max:100'],
            'date_of_joining' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['nullable', 'string', Password::min(8)],
            'permissions' => ['nullable', 'array'],
            'permissions.*.id' => ['nullable', 'exists:permissions,id'],
            'permissions.*.slug' => ['nullable', 'string'],
            'permissions.*.is_granted' => ['required', 'boolean'],
        ]);

        // Resolve role
        $roleId = $validated['role_id'] ?? $user->role_id;
        $roleSlug = $validated['role'] ?? $user->role;

        if (isset($validated['role_id']) && $validated['role_id']) {
            $roleModel = Role::find($validated['role_id']);
            if ($roleModel) {
                $roleSlug = $roleModel->slug;
            }
        } elseif (isset($validated['role'])) {
            $roleModel = Role::where('slug', $validated['role'])->first();
            if ($roleModel) {
                $roleId = $roleModel->id;
            }
        }

        $userData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'employee_code' => $validated['employee_code'] ?? $user->employee_code,
            'role' => $roleSlug,
            'role_id' => $roleId,
            'department' => $validated['department'] ?? $user->department,
            'designation' => $validated['designation'] ?? $user->designation,
            'date_of_joining' => $validated['date_of_joining'] ?? $user->date_of_joining,
            'status' => $validated['status'],
        ];

        if (!empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);

        // Update direct permission overrides if provided
        if (isset($validated['permissions'])) {
            $syncData = [];
            foreach ($validated['permissions'] as $perm) {
                $pId = $perm['id'] ?? null;
                if (!$pId && !empty($perm['slug'])) {
                    $pId = Permission::where('slug', $perm['slug'])->value('id');
                }
                if ($pId) {
                    $syncData[$pId] = ['is_granted' => $perm['is_granted']];
                }
            }
            $user->permissions()->sync($syncData);
        }

        return response()->json([
            'message' => 'Staff record updated successfully',
            'user' => $user->fresh()->load('customRole:id,name,slug,color,is_system'),
        ]);
    }

    /**
     * Quick status toggle (active, inactive, suspended).
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        if ($request->user()->id === $user->id && $validated['status'] !== 'active') {
            return response()->json([
                'message' => 'You cannot deactivate or suspend your own account.',
            ], 422);
        }

        $user->update(['status' => $validated['status']]);

        return response()->json([
            'message' => "User status updated to {$validated['status']}",
            'user' => $user,
        ]);
    }

    /**
     * Remove the specified user.
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Preview the next sequential employee identification code.
     */
    public function nextEmployeeCode(): JsonResponse
    {
        return response()->json([
            'next_code' => $this->generateNextEmployeeCode(),
        ]);
    }

    /**
     * List all distinct departments and staff headcount.
     */
    public function departments(): JsonResponse
    {
        $departments = User::where('role', '!=', 'client')
            ->whereNotNull('department')
            ->select('department', DB::raw('count(*) as staff_count'))
            ->groupBy('department')
            ->orderBy('department')
            ->get();

        return response()->json([
            'departments' => $departments,
        ]);
    }

    /**
     * Helper to compute next available EMP-XXX code.
     */
    private function generateNextEmployeeCode(): string
    {
        $maxNum = 0;
        $codes = User::whereNotNull('employee_code')->pluck('employee_code');
        foreach ($codes as $c) {
            if (preg_match('/EMP-(\d+)/', $c, $m)) {
                $num = (int) $m[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }
        $next = $maxNum + 1;
        return 'EMP-' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }
}
