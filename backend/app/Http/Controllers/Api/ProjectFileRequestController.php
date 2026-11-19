<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFileRequest;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ProjectFileRequestController extends Controller
{
    /**
     * Check if authenticated user is the assigned PM or an Admin.
     */
    protected function authorizeProjectManager(Request $request, Project $project): bool
    {
        $user = $request->user();
        if (!$user) return false;

        $isManager = (int)$project->manager_id === (int)$user->id;
        $isAdmin = in_array($user->role, ['superadmin', 'admin']) ||
            ($user->customRole && in_array($user->customRole->slug, ['superadmin', 'admin']));

        return $isManager || $isAdmin;
    }

    /**
     * List all file requests for a project.
     */
    public function index(Request $request, Project $project): JsonResponse
    {
        $requests = $project->fileRequests()
            ->with(['requester:id,name,email', 'reviewer:id,name,email', 'client:id,name,company_name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'file_requests' => $requests,
            'can_manage' => $this->authorizeProjectManager($request, $project),
            'show_tasks_to_client' => (bool)$project->show_tasks_to_client,
        ]);
    }

    /**
     * Create a new file request to the client (PM-exclusive).
     */
    public function store(Request $request, Project $project): JsonResponse
    {
        if (!$this->authorizeProjectManager($request, $project)) {
            return response()->json([
                'message' => 'Unauthorized. Only the assigned Project Manager can request files and documents from the client.'
            ], 403);
        }

        if (!$project->client_id) {
            return response()->json([
                'message' => 'This project does not have an assigned client to request files from.'
            ], 422);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_type_allowed' => 'nullable|string|max:100',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|string|in:normal,high,urgent',
        ]);

        $fileRequest = $project->fileRequests()->create([
            'client_id' => $project->client_id,
            'requested_by' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'file_type_allowed' => $validated['file_type_allowed'] ?? 'any',
            'due_date' => $validated['due_date'] ?? null,
            'priority' => $validated['priority'] ?? 'normal',
            'status' => 'pending',
        ]);

        $fileRequest->load(['requester:id,name,email', 'client:id,name,company_name']);

        // Dispatch instant push & in-app notification to the client
        try {
            $client = $project->client ?: $fileRequest->client;
            if ($client) {
                PushNotificationService::sendToClient(
                    $client,
                    "Document Requested: " . $fileRequest->title,
                    "Your project lead requested a document for project \"{$project->name}\". Tap to upload files.",
                    [
                        'type' => 'project_document_request',
                        'screen' => 'ProjectDetail',
                        'projectId' => $project->id,
                        'project_id' => $project->id,
                        'request_id' => $fileRequest->id,
                        'action_url' => "/portal/projects/{$project->id}",
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::warning('[ProjectFileRequestController] Failed to send document request notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'File request sent to client successfully.',
            'file_request' => $fileRequest,
        ], 201);
    }

    /**
     * PM Review: Approve or Request Revision on submitted document.
     */
    public function review(Request $request, Project $project, ProjectFileRequest $fileRequest): JsonResponse
    {
        if (!$this->authorizeProjectManager($request, $project)) {
            return response()->json([
                'message' => 'Unauthorized. Only the assigned Project Manager can review client document submissions.'
            ], 403);
        }

        if ((int)$fileRequest->project_id !== (int)$project->id) {
            return response()->json(['message' => 'File request does not belong to this project.'], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected',
            'review_notes' => 'nullable|string',
        ]);

        $fileRequest->update([
            'status' => $validated['status'],
            'review_notes' => $validated['review_notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        $fileRequest->load(['requester:id,name,email', 'reviewer:id,name,email']);

        // Dispatch instant push & in-app notification to client on review decision
        try {
            $client = $project->client ?: $fileRequest->client;
            if ($client) {
                if ($validated['status'] === 'rejected') {
                    $notes = !empty($validated['review_notes']) ? ": " . $validated['review_notes'] : ". Please re-upload.";
                    PushNotificationService::sendToClient(
                        $client,
                        "Revision Requested: " . $fileRequest->title,
                        "Changes requested for project \"{$project->name}\"{$notes}",
                        [
                            'type' => 'project_document_revision',
                            'screen' => 'ProjectDetail',
                            'projectId' => $project->id,
                            'project_id' => $project->id,
                            'request_id' => $fileRequest->id,
                            'action_url' => "/portal/projects/{$project->id}",
                        ]
                    );
                } else {
                    PushNotificationService::sendToClient(
                        $client,
                        "Document Approved: " . $fileRequest->title,
                        "Your document has been verified and approved for project \"{$project->name}\".",
                        [
                            'type' => 'project_document_approved',
                            'screen' => 'ProjectDetail',
                            'projectId' => $project->id,
                            'project_id' => $project->id,
                            'request_id' => $fileRequest->id,
                            'action_url' => "/portal/projects/{$project->id}",
                        ]
                    );
                }
            }
        } catch (\Throwable $e) {
            Log::warning('[ProjectFileRequestController] Failed to send document review notification: ' . $e->getMessage());
        }

        $message = $validated['status'] === 'approved'
            ? 'Document accepted and approved successfully.'
            : 'Revision requested. The client has been notified to re-upload.';

        return response()->json([
            'message' => $message,
            'file_request' => $fileRequest,
        ]);
    }

    /**
     * Download the submitted document file with security response headers.
     */
    public function download(Project $project, ProjectFileRequest $fileRequest)
    {
        if ((int)$fileRequest->project_id !== (int)$project->id) {
            abort(404, 'File request not found.');
        }

        if (!$fileRequest->file_path || !Storage::disk('public')->exists($fileRequest->file_path)) {
            abort(404, 'Uploaded document file does not exist or has been removed.');
        }

        $fullPath = Storage::disk('public')->path($fileRequest->file_path);
        $fileName = $fileRequest->file_name ?: basename($fullPath);

        $headers = [
            'Content-Type' => $fileRequest->mime_type ?: 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
            'X-Download-Options' => 'noopen',
            'Content-Security-Policy' => "default-src 'none'; sandbox",
        ];

        return response()->download($fullPath, $fileName, $headers);
    }

    /**
     * Delete or cancel a file request.
     */
    public function destroy(Request $request, Project $project, ProjectFileRequest $fileRequest): JsonResponse
    {
        if (!$this->authorizeProjectManager($request, $project)) {
            return response()->json([
                'message' => 'Unauthorized. Only the assigned Project Manager can delete file requests.'
            ], 403);
        }

        if ((int)$fileRequest->project_id !== (int)$project->id) {
            return response()->json(['message' => 'File request does not belong to this project.'], 404);
        }

        if ($fileRequest->file_path && Storage::disk('public')->exists($fileRequest->file_path)) {
            Storage::disk('public')->delete($fileRequest->file_path);
        }

        $fileRequest->delete();

        return response()->json([
            'message' => 'File request deleted successfully.'
        ]);
    }

    /**
     * Update client task visibility setting for this project.
     */
    public function updateClientVisibility(Request $request, Project $project): JsonResponse
    {
        if (!$this->authorizeProjectManager($request, $project)) {
            return response()->json([
                'message' => 'Unauthorized. Only the assigned Project Manager can configure client task visibility.'
            ], 403);
        }

        $validated = $request->validate([
            'show_tasks_to_client' => 'required|boolean',
        ]);

        $project->update([
            'show_tasks_to_client' => (bool)$validated['show_tasks_to_client'],
        ]);

        return response()->json([
            'message' => $project->show_tasks_to_client
                ? 'Project tasks are now visible to the client in their portal and mobile app.'
                : 'Project tasks are now hidden from the client portal and mobile app.',
            'show_tasks_to_client' => (bool)$project->show_tasks_to_client,
        ]);
    }
}
