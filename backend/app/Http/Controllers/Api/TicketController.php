<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketReply;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    /**
     * List tickets for ERP Staff / Admins (with client and project details).
     */
    public function index(Request $request)
    {
        $query = Ticket::with(['client', 'project', 'assignee'])->withCount('replies');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ticket_number', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        $stats = [
            'total_tickets' => Ticket::count(),
            'open_tickets' => Ticket::where('status', 'open')->count(),
            'in_progress' => Ticket::where('status', 'in_progress')->count(),
            'resolved' => Ticket::where('status', 'resolved')->count(),
        ];

        return response()->json([
            'tickets' => $tickets,
            'stats' => $stats,
        ]);
    }

    /**
     * Store new ticket (from staff or client).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'project_id' => 'nullable|exists:projects,id',
            'assigned_to' => 'nullable|exists:users,id',
            'subject' => 'required|string|max:255',
            'type' => 'required|in:issue,change_request,improvement,query,billing',
            'priority' => 'required|in:low,medium,high,critical',
            'description' => 'required|string',
        ]);

        $count = Ticket::count() + 1;
        $ticketNumber = 'TIK-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        while (Ticket::where('ticket_number', $ticketNumber)->exists()) {
            $count++;
            $ticketNumber = 'TIK-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        }

        $ticket = Ticket::create([
            'ticket_number' => $ticketNumber,
            'client_id' => $validated['client_id'],
            'project_id' => $validated['project_id'] ?? null,
            'assigned_to' => $validated['assigned_to'] ?? null,
            'subject' => $validated['subject'],
            'type' => $validated['type'],
            'priority' => $validated['priority'],
            'status' => 'open',
            'description' => $validated['description'],
        ]);

        $ticket->load(['client', 'project', 'assignee']);

        return response()->json([
            'message' => 'Ticket created successfully.',
            'ticket' => $ticket,
        ], 201);
    }

    /**
     * Show single ticket with its discussion thread replies.
     */
    public function show(Ticket $ticket)
    {
        $ticket->load(['client', 'project', 'assignee', 'replies.staff', 'replies.client']);
        return response()->json(['ticket' => $ticket]);
    }

    /**
     * Update ticket metadata (status, priority, assignee).
     */
    public function update(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'status' => 'nullable|in:open,in_progress,awaiting_client_reply,resolved,closed',
            'priority' => 'nullable|in:low,medium,high,critical',
            'assigned_to' => 'nullable|exists:users,id',
            'project_id' => 'nullable|exists:projects,id',
        ]);

        $updates = [];
        if (isset($validated['status'])) {
            $updates['status'] = $validated['status'];
            if ($validated['status'] === 'resolved' && !$ticket->resolved_at) {
                $updates['resolved_at'] = now();
            }
        }
        if (isset($validated['priority'])) $updates['priority'] = $validated['priority'];
        if (array_key_exists('assigned_to', $validated)) $updates['assigned_to'] = $validated['assigned_to'];
        if (array_key_exists('project_id', $validated)) $updates['project_id'] = $validated['project_id'];

        $ticket->update($updates);
        $ticket->load(['client', 'project', 'assignee', 'replies.staff', 'replies.client']);

        return response()->json([
            'message' => 'Ticket updated successfully.',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Reply to ticket.
     */
    public function reply(Request $request, Ticket $ticket)
    {
        $validated = $request->validate([
            'message' => 'required|string',
            'status' => 'nullable|in:open,in_progress,awaiting_client_reply,resolved,closed',
        ]);

        $user = $request->user();
        $isStaff = $user->role !== 'client';

        $reply = TicketReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $isStaff ? $user->id : null,
            'client_id' => !$isStaff ? Client::where('user_id', $user->id)->value('id') : null,
            'message' => $validated['message'],
            'is_staff_reply' => $isStaff,
        ]);

        // Auto update ticket status
        $newStatus = $validated['status'] ?? ($isStaff ? 'awaiting_client_reply' : 'in_progress');
        $ticketUpdate = ['status' => $newStatus];
        if ($newStatus === 'resolved' && !$ticket->resolved_at) {
            $ticketUpdate['resolved_at'] = now();
        }
        $ticket->update($ticketUpdate);

        $reply->load(['staff', 'client']);
        $ticket->load(['client', 'project', 'assignee', 'replies.staff', 'replies.client']);

        return response()->json([
            'message' => 'Reply posted successfully.',
            'reply' => $reply,
            'ticket' => $ticket,
        ]);
    }
}

