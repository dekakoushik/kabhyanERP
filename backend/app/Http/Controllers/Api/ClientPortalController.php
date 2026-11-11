<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Invoice;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Services\MailNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClientPortalController extends Controller
{
    /**
     * Resolve the active client profile for the authenticated user.
     * If an admin/superadmin is previewing the portal, gracefully resolve the first active client.
     */
    protected function getClient(Request $request): Client
    {
        $user = $request->user();
        $client = Client::where('user_id', $user->id)->first();

        if (!$client) {
            // Also check by user email
            $client = Client::where('email', $user->email)->first();
        }

        // If logged in as staff/superadmin/admin previewing the portal, pick the primary client for preview
        if (!$client && in_array($user->role, ['superadmin', 'admin', 'manager', 'hr', 'employee'])) {
            $client = Client::where('portal_access_status', 'active')->first();
        }

        if (!$client) {
            abort(403, 'No client profile associated with this account. Please register a client first.');
        }

        return $client;
    }

    /**
     * Client Portal Dashboard: Overview of projects, progress, open tickets and invoices.
     */
    public function dashboard(Request $request)
    {
        $client = $this->getClient($request);

        $projects = Project::where('client_id', $client->id)
            ->with(['manager', 'tasks' => function ($q) {
                $q->select('id', 'project_id', 'title', 'status', 'priority', 'due_date');
            }])
            ->get();

        $tickets = Ticket::where('client_id', $client->id)
            ->with('project')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $invoices = Invoice::where('client_email', $client->email)
            ->orderBy('invoice_date', 'desc')
            ->take(5)
            ->get();

        $stats = [
            'total_projects' => $projects->count(),
            'active_projects' => $projects->whereIn('status', ['planning', 'in_progress'])->count(),
            'completed_projects' => $projects->where('status', 'completed')->count(),
            'open_tickets' => Ticket::where('client_id', $client->id)->whereIn('status', ['open', 'in_progress', 'awaiting_client_reply'])->count(),
            'total_invoiced' => (float) Invoice::where('client_email', $client->email)->sum('total_amount'),
            'total_due' => (float) Invoice::where('client_email', $client->email)->sum('due_amount'),
        ];

        return response()->json([
            'client' => $client,
            'projects' => $projects,
            'recent_tickets' => $tickets,
            'recent_invoices' => $invoices,
            'stats' => $stats,
        ]);
    }

    /**
     * Client's project list.
     */
    public function projects(Request $request)
    {
        $client = $this->getClient($request);
        $projects = Project::where('client_id', $client->id)
            ->with(['manager', 'tasks'])
            ->get();

        return response()->json(['projects' => $projects]);
    }

    /**
     * Single project detail for client.
     */
    public function showProject(Request $request, Project $project)
    {
        $client = $this->getClient($request);
        if ($project->client_id !== $client->id) {
            abort(403, 'Unauthorized access to this project.');
        }

        $project->load(['manager', 'tasks', 'members']);

        $tickets = Ticket::where('client_id', $client->id)
            ->where('project_id', $project->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'project' => $project,
            'tickets' => $tickets,
        ]);
    }

    /**
     * Client ticket list.
     */
    public function tickets(Request $request)
    {
        $client = $this->getClient($request);

        $query = Ticket::where('client_id', $client->id)->with(['project', 'assignee'])->withCount('replies');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        return response()->json(['tickets' => $tickets]);
    }

    /**
     * Client creates ticket (Issue, Change Request, Improvement, Query).
     */
    public function createTicket(Request $request)
    {
        $client = $this->getClient($request);

        $validated = $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'subject' => 'required|string|max:255',
            'type' => 'required|in:issue,change_request,improvement,query,billing',
            'priority' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
        ]);

        // Ensure project belongs to client if specified
        if (!empty($validated['project_id'])) {
            $proj = Project::find($validated['project_id']);
            if ($proj && $proj->client_id !== $client->id) {
                abort(403, 'Invalid project chosen.');
            }
        }

        $count = Ticket::count() + 1;
        $ticketNumber = 'TIK-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        while (Ticket::where('ticket_number', $ticketNumber)->exists()) {
            $count++;
            $ticketNumber = 'TIK-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        }

        $ticket = Ticket::create([
            'ticket_number' => $ticketNumber,
            'client_id' => $client->id,
            'project_id' => $validated['project_id'] ?? null,
            'subject' => $validated['subject'],
            'type' => $validated['type'],
            'priority' => $validated['priority'],
            'status' => 'open',
            'description' => $validated['description'],
        ]);

        $ticket->load(['client', 'project']);

        try {
            MailNotificationService::sendTicketCreated($ticket, 'client');
        } catch (\Throwable $e) {
            Log::error("Failed to send client portal ticket creation email: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Ticket raised successfully. Our engineering team has been notified.',
            'ticket' => $ticket,
        ], 201);
    }

    /**
     * Client views specific ticket and thread.
     */
    public function showTicket(Request $request, Ticket $ticket)
    {
        $client = $this->getClient($request);
        if ($ticket->client_id !== $client->id) {
            abort(403, 'Unauthorized access to this ticket.');
        }

        $ticket->load(['client', 'project', 'assignee', 'replies.staff', 'replies.client']);

        return response()->json(['ticket' => $ticket]);
    }

    /**
     * Client adds reply to ticket.
     */
    public function replyTicket(Request $request, Ticket $ticket)
    {
        $client = $this->getClient($request);
        if ($ticket->client_id !== $client->id) {
            abort(403, 'Unauthorized access to this ticket.');
        }

        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'client_id' => $client->id,
            'user_id' => null,
            'message' => $validated['message'],
            'is_staff_reply' => false,
        ]);

        // Move status back to in_progress if was awaiting reply
        if ($ticket->status === 'awaiting_client_reply') {
            $ticket->update(['status' => 'in_progress']);
        }

        $reply->load('client');
        $ticket->load(['client', 'project', 'assignee', 'replies.staff', 'replies.client']);

        try {
            MailNotificationService::sendTicketReply($ticket, $reply, false);
        } catch (\Throwable $e) {
            Log::error("Failed to send client portal reply email: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Reply posted successfully.',
            'reply' => $reply,
            'ticket' => $ticket,
        ]);
    }
}

