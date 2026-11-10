<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    /**
     * List projects with filters, progress stats, and relations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Project::with(['manager:id,name,email,role', 'members:id,name,email,role', 'client:id,client_code,name,company_name,email'])
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => function ($q) {
                    $q->where('status', 'completed');
                },
            ]);

        // Search by project name, code, or client
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Priority filter
        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        $perPage = (int) $request->input('per_page', 15);
        $projects = $query->latest()->paginate($perPage);

        // Aggregate statistics
        $stats = [
            'total_projects' => Project::count(),
            'in_progress' => Project::where('status', 'in_progress')->count(),
            'completed' => Project::where('status', 'completed')->count(),
            'planning' => Project::where('status', 'planning')->count(),
            'on_hold' => Project::where('status', 'on_hold')->count(),
            'total_tasks' => Task::count(),
            'completed_tasks' => Task::where('status', 'completed')->count(),
        ];

        return response()->json([
            'projects' => $projects,
            'stats' => $stats,
        ]);
    }

    /**
     * Store new project and assign team members.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:projects,code'],
            'description' => ['nullable', 'string'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', Rule::in(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date', 'after_or_equal:start_date'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['exists:users,id'],
        ]);

        $project = Project::create($validated);

        if (! empty($validated['member_ids'])) {
            $project->members()->sync($validated['member_ids']);
        }

        return response()->json([
            'message' => 'Project created successfully',
            'project' => $project->load(['manager:id,name,email', 'members:id,name,email']),
        ], 201);
    }

    /**
     * Show single project with tasks and team members.
     */
    public function show(Project $project): JsonResponse
    {
        $project->load([
            'manager:id,name,email,role,designation',
            'members:id,name,email,role,designation',
            'tasks.assignee:id,name,email',
            'tasks.creator:id,name,email',
        ]);

        return response()->json([
            'project' => $project,
        ]);
    }

    /**
     * Update project.
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', Rule::unique('projects', 'code')->ignore($project->id)],
            'description' => ['nullable', 'string'],
            'client_id' => ['nullable', 'exists:clients,id'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'status' => ['required', Rule::in(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => ['exists:users,id'],
        ]);

        $project->update($validated);

        if (isset($validated['member_ids'])) {
            $project->members()->sync($validated['member_ids']);
        }

        $project->recalculateProgress();

        return response()->json([
            'message' => 'Project updated successfully',
            'project' => $project->fresh()->load(['manager:id,name,email', 'members:id,name,email']),
        ]);
    }

    /**
     * Delete project.
     */
    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json([
            'message' => 'Project deleted successfully',
        ]);
    }
}

