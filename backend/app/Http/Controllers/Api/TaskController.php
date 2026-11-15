<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
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
        // Enforce that tasks must belong to an active, non-deleted project
        $query = Task::has('project')->with(['project:id,name,code', 'assignee:id,name,email', 'creator:id,name,email']);

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
                'total' => Task::has('project')->count(),
                'todo' => Task::has('project')->where('status', 'todo')->count(),
                'in_progress' => Task::has('project')->where('status', 'in_progress')->count(),
                'in_review' => Task::has('project')->where('status', 'in_review')->count(),
                'completed' => Task::has('project')->where('status', 'completed')->count(),
                'blocked' => Task::has('project')->where('status', 'blocked')->count(),
            ],
        ]);
    }

    /**
     * Create new task.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $validated = $request->validated();
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
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $validated = $request->validated();

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

