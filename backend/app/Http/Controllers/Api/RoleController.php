<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of roles with staff counts and permissions.
     */
    public function index(Request $request): JsonResponse
    {
        $roles = Role::with(['permissions:id,module,action,slug,name'])
            ->withCount('users')
            ->orderByDesc('is_system')
            ->orderBy('name')
            ->get();

        return response()->json([
            'roles' => $roles,
            'total_roles' => $roles->count(),
            'system_roles_count' => $roles->where('is_system', true)->count(),
            'custom_roles_count' => $roles->where('is_system', false)->count(),
        ]);
    }

    /**
     * Store a newly created custom staff role.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'slug' => ['nullable', 'string', 'max:100', 'unique:roles,slug'],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:30'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ]);

        $slug = !empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        // Prevent taking reserved client slug
        if ($slug === 'client') {
            return response()->json([
                'message' => 'The slug "client" is reserved for external client portal accounts.',
            ], 422);
        }

        $role = Role::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'color' => $validated['color'] ?? 'blue',
            'is_system' => false,
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Custom role created successfully',
            'role' => $role->fresh()->load('permissions:id,module,action,slug,name'),
        ], 201);
    }

    /**
     * Display the specified role with its permissions and staff members.
     */
    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'role' => $role->load([
                'permissions:id,module,action,slug,name,description',
                'users:id,name,email,employee_code,department,designation,status',
            ])->loadCount('users'),
        ]);
    }

    /**
     * Update the specified custom role.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $rules = [
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role->id)],
            'description' => ['nullable', 'string'],
            'color' => ['nullable', 'string', 'max:30'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string'],
        ];

        // System roles cannot have their slug altered
        if (!$role->is_system) {
            $rules['slug'] = ['nullable', 'string', 'max:100', Rule::unique('roles', 'slug')->ignore($role->id)];
        }

        $validated = $request->validate($rules);

        $data = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $role->description,
            'color' => $validated['color'] ?? $role->color,
        ];

        if (!$role->is_system && !empty($validated['slug'])) {
            $slug = Str::slug($validated['slug']);
            if ($slug === 'client') {
                return response()->json([
                    'message' => 'The slug "client" is reserved for external client portal accounts.',
                ], 422);
            }
            $data['slug'] = $slug;
        }

        $role->update($data);

        // System roles can still have permissions tuned, or custom roles can sync
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'role' => $role->fresh()->load('permissions:id,module,action,slug,name'),
        ]);
    }

    /**
     * Delete a custom staff role.
     */
    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            return response()->json([
                'message' => 'System protected roles (SuperAdmin, Admin, Manager, HR, Employee) cannot be deleted.',
            ], 422);
        }

        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => "Cannot delete role \"{$role->name}\" because it is currently assigned to {$role->users()->count()} staff member(s). Please reassign staff before deleting.",
            ], 422);
        }

        $role->permissions()->detach();
        $role->delete();

        return response()->json([
            'message' => 'Custom role deleted successfully',
        ]);
    }
}
