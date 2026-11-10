<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * List tasks (all or scoped to project).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['project:id,name,code', 'assignee:id,name,email', 'creator:id,name,email']);

        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->input('priority')) {
            $query->where('priority', $priority);
        }

        if ($assignedTo = $request->input('assigned_to')) {
            $query->where('assigned_to', $assignedTo);
        }

        $perPage = (int) $request->input('per_page', 20);
        $tasks = $query->latest()->paginate($perPage);

        return response()->json([
            'tasks' => $tasks,
            'summary' => [
                'total' => Task::count(),
                'todo' => Task::where('status', 'todo')->count(),
                'in_progress' => Task::where('status', 'in_progress')->count(),
                'in_review' => Task::where('status', 'in_review')->count(),
                'completed' => Task::where('status', 'completed')->count(),
                'blocked' => Task::where('status', 'blocked')->count(),
            ],
        ]);
    }

    /**
     * Create new task.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'blocked'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'estimated_hours' => ['nullable', 'integer', 'min:0'],
            'logged_hours' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
        ]);

        $validated['created_by'] = $request->user()->id;

        if ($validated['status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        $task = Task::create($validated);

        // Update project progress
        $task->project->recalculateProgress();

        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task->load(['project:id,name,code', 'assignee:id,name,email', 'creator:id,name,email']),
        ], 201);
    }

    /**
     * Show task.
     */
    public function show(Task $task): JsonResponse
    {
        return response()->json([
            'task' => $task->load(['project:id,name,code', 'assignee:id,name,email', 'creator:id,name,email']),
        ]);
    }

    /**
     * Update task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => ['required', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'blocked'])],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'estimated_hours' => ['nullable', 'integer', 'min:0'],
            'logged_hours' => ['nullable', 'integer', 'min:0'],
            'due_date' => ['nullable', 'date'],
        ]);

        if ($validated['status'] === 'completed' && ! $task->completed_at) {
            $validated['completed_at'] = now();
        } elseif ($validated['status'] !== 'completed') {
            $validated['completed_at'] = null;
        }

        $task->update($validated);

        $task->project->recalculateProgress();

        return response()->json([
            'message' => 'Task updated successfully',
            'task' => $task->fresh()->load(['project:id,name,code', 'assignee:id,name,email', 'creator:id,name,email']),
        ]);
    }

    /**
     * Quick status update (e.g. Kanban drag and drop).
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'blocked'])],
        ]);

        $data = ['status' => $validated['status']];
        if ($validated['status'] === 'completed') {
            $data['completed_at'] = now();
        } else {
            $data['completed_at'] = null;
        }

        $task->update($data);
        $task->project->recalculateProgress();

        return response()->json([
            'message' => 'Task status updated to ' . $validated['status'],
            'task' => $task->fresh()->load(['project:id,name,code', 'assignee:id,name,email']),
        ]);
    }

    /**
     * Delete task.
     */
    public function destroy(Task $task): JsonResponse
    {
        $project = $task->project;
        $task->delete();
        $project->recalculateProgress();

        return response()->json([
            'message' => 'Task deleted successfully',
        ]);
    }
}

