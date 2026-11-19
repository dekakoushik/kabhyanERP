<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientDeviceToken;
use App\Models\Estimate;
use App\Models\Invoice;
use App\Models\ProformaInvoice;
use App\Models\ReceiptVoucher;
use App\Models\Project;
use App\Models\ProjectFileRequest;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Services\DocumentNumberService;
use App\Services\FileSanitizerService;
use App\Services\MailNotificationService;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

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

        // If logged in as staff/superadmin/admin previewing the portal, pick any active client
        if (!$client && in_array($user->role, ['superadmin', 'admin', 'manager', 'hr', 'employee'])) {
            $client = Client::where('portal_access_status', 'active')->first()
                ?? Client::orderBy('id', 'desc')->first();
        }

        if (!$client) {
            // Gracefully construct an ephemeral preview profile so testing accounts never crash
            $client = new Client([
                'name' => $user->name,
                'company_name' => 'Kabhyan Technologies Partner Preview',
                'email' => $user->email,
                'phone' => $user->phone ?? '+91 60000 00000',
                'portal_access_status' => 'active',
            ]);
            $client->id = 0;
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
            ->with(['manager', 'fileRequests', 'tasks' => function ($q) {
                $q->select('id', 'project_id', 'title', 'status', 'priority', 'due_date');
            }])
            ->get();

        $tickets = Ticket::where('client_id', $client->id)
            ->with('project')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $invoices = Invoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->with(['proformaInvoice:id,proforma_number,status', 'payments'])
            ->orderBy('invoice_date', 'desc')
            ->take(5)
            ->get();

        $activeEstimates = Estimate::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->whereIn('status', ['sent', 'accepted', 'invoiced'])
            ->with(['proformaInvoices:id,estimate_id,proforma_number,status'])
            ->orderBy('estimate_date', 'desc')
            ->take(3)
            ->get();

        $activeProformas = ProformaInvoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->whereIn('status', ['unpaid', 'partially_paid', 'partially_invoiced', 'fully_invoiced'])
            ->with([
                'taxInvoices:id,proforma_invoice_id,invoice_number,status,total_amount,due_amount,paid_amount',
                'receiptVouchers:id,proforma_invoice_id,voucher_number,status,amount_received,remaining_advance,voucher_date',
            ])
            ->orderBy('invoice_date', 'desc')
            ->take(3)
            ->get();

        // 1. Tax Invoices Financials
        $invoicesQuery = Invoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft');
        $taxInvoicesDue = (float) (clone $invoicesQuery)->sum('due_amount');
        $taxInvoicesPaid = (float) (clone $invoicesQuery)->sum('paid_amount');
        $taxInvoicesTotal = (float) (clone $invoicesQuery)->sum('total_amount');
        $unpaidTaxInvoicesCount = (clone $invoicesQuery)->whereIn('status', ['unpaid', 'partially_paid', 'overdue'])->count();

        // 2. Active Proforma Invoices (Account for unbilled / pending proforma advance)
        $allActiveProformas = ProformaInvoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->whereNotIn('status', ['cancelled'])
            ->with([
                'taxInvoices' => function ($q) {
                    $q->where('status', '!=', 'cancelled');
                },
                'receiptVouchers' => function ($q) {
                    $q->where('status', '!=', 'cancelled');
                },
            ])
            ->get();

        $proformaOutstanding = 0.0;
        $proformaAdvancePaid = 0.0;
        $unpaidProformasCount = 0;

        foreach ($allActiveProformas as $proforma) {
            $proformaTotal = (float) $proforma->total_amount;
            $invoicedScope = (float) $proforma->taxInvoices->sum('total_amount');
            $remainingScope = max(0, $proformaTotal - $invoicedScope);
            $voucherAdvance = (float) $proforma->receiptVouchers->sum('amount_received');
            $advancePaid = max((float) ($proforma->paid_amount ?? 0), $voucherAdvance);

            $unpaidScope = max(0, $remainingScope - max(0, $advancePaid - $invoicedScope));
            $proformaOutstanding += $unpaidScope;

            if ($unpaidScope > 0.01) {
                $unpaidProformasCount++;
            }

            if ($advancePaid > $invoicedScope) {
                $proformaAdvancePaid += ($advancePaid - $invoicedScope);
            }
        }

        // Transform active proformas with dynamic outstanding and payment status
        $activeProformas->transform(function ($pi) {
            $advancePaid = max((float) ($pi->paid_amount ?? 0), (float) $pi->receiptVouchers->sum('amount_received'));
            $dueAmount = max(0, (float) $pi->total_amount - $advancePaid);
            $pi->paid_amount = $advancePaid;
            $pi->due_amount = $dueAmount;
            $pi->remaining_amount = $dueAmount;
            if ($dueAmount <= 0.01) {
                $pi->status = 'paid';
            } elseif ($advancePaid > 0.01) {
                $pi->status = 'partially_paid';
            }
            return $pi;
        });

        // 3. Consolidated Outstanding Balance & Paid Figures
        $totalDue = round($taxInvoicesDue + $proformaOutstanding, 2);
        $totalPaid = round($taxInvoicesPaid + $proformaAdvancePaid, 2);
        $totalInvoiced = round($taxInvoicesTotal + $proformaOutstanding, 2);
        $unpaidCount = $unpaidTaxInvoicesCount + $unpaidProformasCount;

        $stats = [
            'total_projects' => $projects->count(),
            'active_projects' => $projects->whereIn('status', ['planning', 'in_progress'])->count(),
            'completed_projects' => $projects->where('status', 'completed')->count(),
            'open_tickets' => Ticket::where('client_id', $client->id)->whereIn('status', ['open', 'in_progress', 'awaiting_client_reply'])->count(),
            'total_invoiced' => $totalInvoiced,
            'total_due' => $totalDue,
            'unpaid_amount' => $totalDue,
            'paid_amount' => $totalPaid,
            'unpaid_invoices_count' => $unpaidCount,
            'total_invoices' => (clone $invoicesQuery)->count(),
        ];

        return response()->json([
            'client' => $client,
            'projects' => $projects,
            'recent_tickets' => $tickets,
            'recent_invoices' => $invoices,
            'active_estimates' => $activeEstimates,
            'active_proformas' => $activeProformas,
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
            ->with(['manager', 'fileRequests'])
            ->get()
            ->map(function ($proj) {
                if ($proj->show_tasks_to_client) {
                    $proj->load('tasks');
                    $proj->setAttribute('deliverables', $proj->tasks);
                } else {
                    $proj->setRelation('tasks', collect([]));
                    $proj->setAttribute('deliverables', []);
                }
                return $proj;
            });

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

        $project->load(['manager', 'members', 'fileRequests' => function ($q) {
            $q->orderBy('created_at', 'desc');
        }]);

        if ($project->show_tasks_to_client) {
            $project->load('tasks');
            $project->setAttribute('deliverables', $project->tasks);
        } else {
            $project->setRelation('tasks', collect([]));
            $project->setAttribute('deliverables', []);
        }

        $tickets = Ticket::where('client_id', $client->id)
            ->where('project_id', $project->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'project' => $project,
            'tickets' => $tickets,
            'show_tasks_to_client' => (bool)$project->show_tasks_to_client,
            'file_requests' => $project->fileRequests,
        ]);
    }

    /**
     * List file requests for a project in the client portal.
     */
    public function fileRequests(Request $request, Project $project)
    {
        $client = $this->getClient($request);
        if ((int)$project->client_id !== (int)$client->id) {
            abort(403, 'Unauthorized access to this project.');
        }

        $fileRequests = $project->fileRequests()
            ->with('requester:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'file_requests' => $fileRequests,
        ]);
    }

    /**
     * Upload a requested file/document by client.
     */
    public function uploadFileRequest(Request $request, Project $project, ProjectFileRequest $fileRequest)
    {
        $client = $this->getClient($request);
        if ((int)$project->client_id !== (int)$client->id) {
            abort(403, 'Unauthorized access to this project.');
        }

        if ((int)$fileRequest->project_id !== (int)$project->id) {
            abort(404, 'File request not found.');
        }

        $request->validate([
            'file' => 'required|file|max:25600', // max 25MB
        ]);

        $file = $request->file('file');

        // Multi-layer sanitization, binary inspection, and malware scanning
        $sanitizer = app(FileSanitizerService::class);
        $sanitized = $sanitizer->sanitizeAndValidate($file, $fileRequest->file_type_allowed);

        // Delete previous uploaded file if re-uploading
        if ($fileRequest->file_path && Storage::disk('public')->exists($fileRequest->file_path)) {
            Storage::disk('public')->delete($fileRequest->file_path);
        }

        // Store file with safe cryptographically random filename on disk
        $directory = "projects/{$project->id}/client-documents";
        $path = $file->storeAs($directory, $sanitized['safe_stored_filename'], 'public');

        $fileRequest->update([
            'file_path' => $path,
            'file_name' => $sanitized['sanitized_original_name'],
            'file_size' => $sanitized['file_size'],
            'mime_type' => $sanitized['verified_mime_type'],
            'status' => 'submitted',
            'uploaded_at' => now(),
            'review_notes' => null,
        ]);

        // Notify Project Lead when client uploads a document
        try {
            $manager = $project->manager;
            if ($manager) {
                PushNotificationService::sendToUser(
                    $manager,
                    "Client Uploaded Document: {$fileRequest->title}",
                    "Client {$client->name} uploaded a document for project \"{$project->name}\". Ready for review.",
                    [
                        'type' => 'project_document_submitted',
                        'project_id' => $project->id,
                        'request_id' => $fileRequest->id,
                        'action_url' => "/dashboard/projects/{$project->id}?tab=documents",
                    ]
                );
            }
        } catch (\Throwable $e) {
            Log::warning('[ClientPortalController] Failed to notify PM of client upload: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'File uploaded and submitted for Project Manager review successfully.',
            'file_request' => $fileRequest->fresh(['requester:id,name']),
        ]);
    }

    /**
     * Download client file request document with security response headers.
     */
    public function downloadFileRequest(Request $request, Project $project, ProjectFileRequest $fileRequest)
    {
        $client = $this->getClient($request);
        if ((int)$project->client_id !== (int)$client->id) {
            abort(403, 'Unauthorized access to this project.');
        }

        if ((int)$fileRequest->project_id !== (int)$project->id) {
            abort(404, 'File request not found.');
        }

        if (!$fileRequest->file_path || !Storage::disk('public')->exists($fileRequest->file_path)) {
            abort(404, 'File does not exist or has been removed.');
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

    /**
     * Unified commercial documents lifecycle thread feed.
     * Merges Estimates, Proforma Invoices, and Tax Invoices into a single feed with zero tabs,
     * applying precedence rules so converted items become historical lineage.
     */
    public function commercialDocuments(Request $request)
    {
        $client = $this->getClient($request);
        $search = $request->input('search');
        $statusFilter = $request->input('status'); // 'all', 'invoices', 'receipt_vouchers', 'estimates', 'unpaid', 'action_required', 'settled'

        // 1. Fetch all non-draft Tax Invoices
        $invoices = Invoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->with([
                'project:id,name,code',
                'proformaInvoice:id,proforma_number,status,invoice_date,total_amount,estimate_id',
                'proformaInvoice.receiptVouchers:id,proforma_invoice_id,voucher_number,status,amount_received,remaining_advance,voucher_date',
                'estimate:id,estimate_number,status,estimate_date,total_amount',
                'advanceAdjustments.receiptVoucher:id,voucher_number,voucher_date,amount_received,remaining_advance',
                'payments',
            ])
            ->orderBy('invoice_date', 'desc')
            ->get();

        // 2. Fetch all non-draft Receipt Vouchers (Statutory GST Advance Receipts)
        $receiptVouchers = ReceiptVoucher::where('client_email', $client->email)
            ->with([
                'project:id,name,code',
                'estimate:id,estimate_number,status,estimate_date,total_amount',
                'proformaInvoice:id,proforma_number,invoice_date,total_amount',
                'invoiceAdvanceAdjustments.invoice:id,invoice_number,invoice_date,total_amount',
            ])
            ->orderBy('voucher_date', 'desc')
            ->get();

        // 3. Fetch all non-draft Estimates / Quotations
        // Exclude estimates that have already generated a Proforma Invoice or Tax Invoice to eliminate thread duplication
        $estimates = Estimate::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->whereDoesntHave('proformaInvoices')
            ->whereDoesntHave('invoices')
            ->whereNotIn('status', ['invoiced', 'converted'])
            ->with([
                'project:id,name,code',
                'receiptVouchers:id,estimate_id,voucher_number,status,amount_received,remaining_advance,voucher_date',
                'invoices:id,estimate_id,invoice_number,status,total_amount,invoice_date',
                'proformaInvoices:id,estimate_id,proforma_number,status,total_amount,invoice_date',
            ])
            ->orderBy('estimate_date', 'desc')
            ->get();

        // 4. Fetch Proformas (exclude ones already fully converted to Tax Invoices)
        $proformas = ProformaInvoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->whereNotIn('status', ['cancelled'])
            ->whereDoesntHave('taxInvoices', function ($q) {
                $q->where('status', '!=', 'cancelled');
            })
            ->with([
                'project:id,name,code',
                'estimate:id,estimate_number,status,estimate_date,total_amount',
                'receiptVouchers:id,proforma_invoice_id,voucher_number,status,amount_received,remaining_advance,voucher_date',
            ])
            ->orderBy('invoice_date', 'desc')
            ->get();

        $threads = [];

        // Step A: Tax Invoices
        foreach ($invoices as $inv) {
            $history = [];
            $existingVoucherIds = [];

            if ($inv->estimate) {
                $history[] = [
                    'stage' => 'estimate',
                    'id' => $inv->estimate->id,
                    'number' => $inv->estimate->estimate_number,
                    'date' => $inv->estimate->estimate_date,
                    'total_amount' => (float) $inv->estimate->total_amount,
                    'status' => $inv->estimate->status,
                ];
            }

            foreach ($inv->advanceAdjustments as $adj) {
                if ($adj->receiptVoucher) {
                    $existingVoucherIds[] = $adj->receiptVoucher->id;
                    $history[] = [
                        'stage' => 'receipt_voucher',
                        'id' => $adj->receiptVoucher->id,
                        'number' => $adj->receiptVoucher->voucher_number,
                        'date' => $adj->receiptVoucher->voucher_date,
                        'total_amount' => (float) ($adj->receiptVoucher->amount_received ?? $adj->receiptVoucher->total_amount ?? 0),
                        'status' => 'adjusted',
                    ];
                }
            }

            if ($inv->proformaInvoice) {
                // If the proforma invoice had receipt vouchers, nest them into this tax invoice thread as well
                if ($inv->proformaInvoice->receiptVouchers) {
                    foreach ($inv->proformaInvoice->receiptVouchers as $srv) {
                        if (!in_array($srv->id, $existingVoucherIds)) {
                            $existingVoucherIds[] = $srv->id;
                            $history[] = [
                                'stage' => 'receipt_voucher',
                                'id' => $srv->id,
                                'number' => $srv->voucher_number,
                                'date' => $srv->voucher_date,
                                'total_amount' => (float) ($srv->amount_received ?? $srv->total_amount ?? 0),
                                'status' => $srv->status,
                            ];
                        }
                    }
                }

                $history[] = [
                    'stage' => 'proforma',
                    'id' => $inv->proformaInvoice->id,
                    'number' => $inv->proformaInvoice->proforma_number,
                    'date' => $inv->proformaInvoice->invoice_date,
                    'total_amount' => (float) $inv->proformaInvoice->total_amount,
                    'status' => $inv->proformaInvoice->status,
                ];
            }

            $threads[] = [
                'thread_id' => 'inv-' . $inv->id,
                'stage' => 'tax_invoice',
                'headline_id' => $inv->id,
                'headline_number' => $inv->invoice_number,
                'headline_status' => $inv->status,
                'headline_date' => $inv->invoice_date,
                'due_date' => $inv->due_date,
                'total_amount' => (float) $inv->total_amount,
                'due_amount' => (float) $inv->due_amount,
                'paid_amount' => (float) $inv->paid_amount,
                'advance_adjusted' => (float) ($inv->advance_adjusted ?? 0),
                'project_name' => $inv->project?->name,
                'history' => $history,
                'raw_document' => $inv,
            ];
        }

        // Step B: Only Truly Standalone Receipt Vouchers (not linked to any Proforma, Estimate, or Tax Invoice)
        // Vouchers tied to Proformas or Tax Invoices are nested strictly within their parent thread
        $standaloneVouchers = $receiptVouchers->filter(function ($rv) {
            return empty($rv->proforma_invoice_id)
                && empty($rv->estimate_id)
                && empty($rv->invoice_id)
                && (!isset($rv->invoiceAdvanceAdjustments) || $rv->invoiceAdvanceAdjustments->isEmpty());
        });

        foreach ($standaloneVouchers as $rv) {
            $history = [];
            $threads[] = [
                'thread_id' => 'rv-' . $rv->id,
                'stage' => 'receipt_voucher',
                'headline_id' => $rv->id,
                'headline_number' => $rv->voucher_number,
                'headline_status' => $rv->status,
                'headline_date' => $rv->voucher_date,
                'due_date' => null,
                'total_amount' => (float) ($rv->amount_received ?? $rv->total_amount ?? 0),
                'due_amount' => 0.0,
                'paid_amount' => (float) ($rv->amount_received ?? $rv->total_amount ?? 0),
                'adjusted_amount' => (float) ($rv->adjusted_amount ?? 0),
                'remaining_amount' => (float) ($rv->remaining_advance ?? $rv->remaining_amount ?? 0),
                'project_name' => $rv->project?->name,
                'history' => $history,
                'raw_document' => $rv,
            ];
        }

        // Step C: Estimates / Quotations
        foreach ($estimates as $est) {
            $history = [];
            foreach ($est->receiptVouchers as $srv) {
                $history[] = [
                    'stage' => 'receipt_voucher',
                    'id' => $srv->id,
                    'number' => $srv->voucher_number,
                    'date' => $srv->voucher_date,
                    'total_amount' => (float) ($srv->amount_received ?? $srv->total_amount ?? 0),
                    'status' => $srv->status,
                ];
            }

            $threads[] = [
                'thread_id' => 'est-' . $est->id,
                'stage' => 'estimate',
                'headline_id' => $est->id,
                'headline_number' => $est->estimate_number,
                'headline_status' => $est->status,
                'headline_date' => $est->estimate_date,
                'due_date' => $est->expiry_date,
                'total_amount' => (float) $est->total_amount,
                'due_amount' => $est->status === 'accepted' ? (float) $est->total_amount : 0.0,
                'paid_amount' => 0.0,
                'project_name' => $est->project?->name,
                'history' => $history,
                'raw_document' => $est,
            ];
        }

        // Step D: Proformas
        foreach ($proformas as $pi) {
            $history = [];
            if ($pi->estimate) {
                $history[] = [
                    'stage' => 'estimate',
                    'id' => $pi->estimate->id,
                    'number' => $pi->estimate->estimate_number,
                    'date' => $pi->estimate->estimate_date,
                    'total_amount' => (float) $pi->estimate->total_amount,
                    'status' => $pi->estimate->status,
                ];
            }

            $voucherAdvance = 0.0;
            if ($pi->receiptVouchers) {
                foreach ($pi->receiptVouchers as $srv) {
                    $vAmt = (float) ($srv->amount_received ?? $srv->total_amount ?? 0);
                    $voucherAdvance += $vAmt;
                    $history[] = [
                        'stage' => 'receipt_voucher',
                        'id' => $srv->id,
                        'number' => $srv->voucher_number,
                        'date' => $srv->voucher_date,
                        'total_amount' => $vAmt,
                        'status' => $srv->status,
                    ];
                }
            }

            $advancePaid = max((float) ($pi->paid_amount ?? 0), $voucherAdvance);
            $dueAmount = max(0, (float) $pi->total_amount - $advancePaid);
            $headlineStatus = $pi->status;
            if ($dueAmount <= 0.01) {
                $headlineStatus = 'paid';
            } elseif ($advancePaid > 0.01) {
                $headlineStatus = 'partially_paid';
            }

            $threads[] = [
                'thread_id' => 'pi-' . $pi->id,
                'stage' => 'proforma',
                'headline_id' => $pi->id,
                'headline_number' => $pi->proforma_number,
                'headline_status' => $headlineStatus,
                'headline_date' => $pi->invoice_date,
                'due_date' => $pi->due_date,
                'total_amount' => (float) $pi->total_amount,
                'due_amount' => $dueAmount,
                'paid_amount' => $advancePaid,
                'project_name' => $pi->project?->name,
                'history' => $history,
                'raw_document' => $pi,
            ];
        }

        // Sort threads by headline_date descending
        usort($threads, function ($a, $b) {
            return strcmp($b['headline_date'], $a['headline_date']);
        });

        // Search filter
        if ($search) {
            $searchLower = strtolower($search);
            $threads = array_values(array_filter($threads, function ($t) use ($searchLower) {
                return str_contains(strtolower($t['headline_number']), $searchLower)
                    || str_contains(strtolower($t['project_name'] ?? ''), $searchLower);
            }));
        }

        // Status & Category filter
        if ($statusFilter && $statusFilter !== 'all') {
            $threads = array_values(array_filter($threads, function ($t) use ($statusFilter) {
                if ($statusFilter === 'invoices') {
                    return $t['stage'] === 'tax_invoice';
                }
                if ($statusFilter === 'receipt_vouchers' || $statusFilter === 'vouchers') {
                    return $t['stage'] === 'receipt_voucher';
                }
                if ($statusFilter === 'estimates' || $statusFilter === 'quotations') {
                    return $t['stage'] === 'estimate';
                }
                if ($statusFilter === 'unpaid') {
                    return in_array($t['headline_status'], ['unpaid', 'partially_paid', 'overdue', 'sent']);
                }
                if ($statusFilter === 'settled') {
                    return $t['headline_status'] === 'paid' || $t['stage'] === 'receipt_voucher' || $t['headline_status'] === 'accepted';
                }
                if ($statusFilter === 'action_required') {
                    return $t['headline_status'] === 'sent' || $t['headline_status'] === 'unpaid' || $t['headline_status'] === 'overdue';
                }
                return true;
            }));
        }

        return response()->json(['threads' => $threads]);
    }

    /**
     * Client's invoice list.
     */
    public function invoices(Request $request)
    {
        $client = $this->getClient($request);
        $invoices = Invoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->with([
                'items',
                'payments',
                'project:id,name,code',
                'proformaInvoice:id,proforma_number,status,invoice_date,total_amount,tax_calculation_type',
                'estimate:id,estimate_number,status,estimate_date,total_amount,tax_calculation_type',
            ])
            ->orderBy('invoice_date', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json(['invoices' => $invoices]);
    }

    /**
     * Show single invoice for client.
     */
    public function showInvoice(Request $request, Invoice $invoice)
    {
        $client = $this->getClient($request);
        if ($invoice->client_email !== $client->email) {
            abort(403, 'Unauthorized access to this invoice.');
        }

        if ($invoice->status === 'draft') {
            abort(404, 'Invoice not found or is currently in draft preparation.');
        }

        $invoice->load([
            'items',
            'payments',
            'project:id,name,code',
            'proformaInvoice:id,proforma_number,status,invoice_date,total_amount,tax_calculation_type',
            'estimate:id,estimate_number,status,estimate_date,total_amount,tax_calculation_type',
            'advanceAdjustments.receiptVoucher:id,voucher_number,voucher_date,amount_received,adjusted_amount,remaining_advance',
        ]);

        return response()->json(['invoice' => $invoice]);
    }

    /**
     * Client's receipt vouchers list (Statutory GST Advance Receipts).
     */
    public function receiptVouchers(Request $request)
    {
        $client = $this->getClient($request);
        $vouchers = ReceiptVoucher::where('client_email', $client->email)
            ->with([
                'project:id,name,code',
                'estimate:id,estimate_number,status,estimate_date,total_amount,tax_calculation_type',
                'invoiceAdvanceAdjustments.invoice:id,invoice_number,invoice_date,total_amount',
            ])
            ->orderBy('voucher_date', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json(['receipt_vouchers' => $vouchers]);
    }

    /**
     * Show single receipt voucher for client.
     */
    public function showReceiptVoucher(Request $request, ReceiptVoucher $receiptVoucher)
    {
        $client = $this->getClient($request);
        if (strcasecmp(trim($receiptVoucher->client_email), trim($client->email)) !== 0) {
            abort(403, 'Unauthorized access to this receipt voucher.');
        }

        $receiptVoucher->load([
            'project:id,name,code',
            'estimate:id,estimate_number,status,estimate_date,total_amount,tax_calculation_type',
            'proformaInvoice:id,proforma_number,invoice_date,total_amount',
            'invoiceAdvanceAdjustments.invoice:id,invoice_number,invoice_date,total_amount',
            'refundVouchers',
        ]);

        return response()->json(['receipt_voucher' => $receiptVoucher]);
    }

    /**
     * Client's proforma invoice list.
     */
    public function proformaInvoices(Request $request)
    {
        $client = $this->getClient($request);
        $proformas = ProformaInvoice::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->with([
                'items',
                'project:id,name,code',
                'estimate:id,estimate_number,status,estimate_date,total_amount,tax_calculation_type',
                'taxInvoices' => function ($q) {
                    $q->select('id', 'proforma_invoice_id', 'invoice_number', 'status', 'total_amount', 'due_amount', 'paid_amount', 'invoice_date', 'due_date', 'tax_calculation_type')
                        ->orderBy('invoice_date', 'desc');
                },
            ])
            ->orderBy('invoice_date', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json(['proforma_invoices' => $proformas]);
    }

    /**
     * Show single proforma invoice for client.
     */
    public function showProformaInvoice(Request $request, ProformaInvoice $proformaInvoice)
    {
        $client = $this->getClient($request);
        if ($proformaInvoice->client_email !== $client->email) {
            abort(403, 'Unauthorized access to this proforma invoice.');
        }

        if ($proformaInvoice->status === 'draft') {
            abort(404, 'Proforma invoice not found or is currently in draft preparation.');
        }

        $proformaInvoice->load([
            'items',
            'project:id,name,code',
            'estimate:id,estimate_number,status,estimate_date,total_amount,tax_calculation_type',
            'taxInvoices.payments',
            'receiptVouchers:id,proforma_invoice_id,voucher_number,status,amount_received,remaining_advance,voucher_date,taxable_amount,tax_amount,payment_mode,payment_reference',
        ]);

        return response()->json(['proforma_invoice' => $proformaInvoice]);
    }

    /**
     * Client generates Cashfree payment link for an invoice.
     */
    public function invoicePaymentLink(Request $request, Invoice $invoice, \App\Services\CashfreeService $cashfreeService)
    {
        $client = $this->getClient($request);
        if ($invoice->client_email !== $client->email) {
            abort(403, 'Unauthorized access to this invoice.');
        }

        try {
            $returnUrl = $request->input('return_url');
            $result = $cashfreeService->createPaymentLink($invoice, $returnUrl);

            return response()->json([
                'success' => true,
                'payment_link' => $result,
                'invoice' => $invoice->fresh(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Client's estimates / quotations list.
     */
    public function estimates(Request $request)
    {
        $client = $this->getClient($request);
        $estimates = Estimate::where('client_email', $client->email)
            ->where('status', '!=', 'draft')
            ->with([
                'items',
                'project:id,name,code',
                'proformaInvoices' => function ($q) {
                    $q->select('id', 'estimate_id', 'proforma_number', 'status', 'total_amount', 'invoice_date')
                        ->orderBy('invoice_date', 'desc');
                },
            ])
            ->orderBy('estimate_date', 'desc')
            ->paginate($request->input('per_page', 20));

        return response()->json(['estimates' => $estimates]);
    }

    /**
     * Show single estimate for client.
     */
    public function showEstimate(Request $request, Estimate $estimate)
    {
        $client = $this->getClient($request);
        $user = $request->user();
        $isStaff = in_array($user->role, ['superadmin', 'admin', 'manager', 'hr', 'employee']);

        if (!$isStaff && strcasecmp(trim($estimate->client_email), trim($client->email)) !== 0) {
            abort(403, 'Unauthorized access to this quotation.');
        }

        if ($estimate->status === 'draft') {
            abort(404, 'Quotation not found or is currently in draft preparation.');
        }

        $estimate->load([
            'items',
            'project:id,name,code',
            'proformaInvoices' => function ($q) {
                $q->select('id', 'estimate_id', 'proforma_number', 'status', 'total_amount', 'invoice_date')
                    ->with(['taxInvoices:id,proforma_invoice_id,invoice_number,status,total_amount,paid_amount,due_amount,invoice_date'])
                    ->orderBy('invoice_date', 'desc');
            },
        ]);

        return response()->json(['estimate' => $estimate]);
    }

    /**
     * Client responds to estimate (Accept or Decline).
     */
    public function respondEstimate(Request $request, Estimate $estimate)
    {
        $client = $this->getClient($request);
        $user = $request->user();
        $isStaff = in_array($user->role, ['superadmin', 'admin', 'manager', 'hr', 'employee']);

        if (!$isStaff && strcasecmp(trim($estimate->client_email), trim($client->email)) !== 0) {
            abort(403, 'Unauthorized access to this quotation.');
        }

        if ($estimate->status === 'draft') {
            abort(404, 'Cannot respond to a quotation currently in draft.');
        }

        $validated = $request->validate([
            'action' => 'required|in:accepted,declined',
            'feedback' => 'nullable|string|max:1000',
            'reason' => 'nullable|string|max:1000',
        ]);

        $feedback = $request->input('feedback') ?? $request->input('reason');
        $updatedNotes = $estimate->notes;
        if (!empty($feedback)) {
            $updatedNotes = ($updatedNotes ? $updatedNotes . "\n" : "") . "Client " . ucfirst($validated['action']) . " Note: " . trim($feedback);
        }

        if ($validated['action'] === 'accepted') {
            $proforma = DB::transaction(function () use ($estimate, $user, $updatedNotes) {
                $estimate->loadMissing(['items']);

                // Idempotency: Check if a Proforma Invoice is already linked
                $existing = $estimate->proformaInvoices()->first();
                if ($existing) {
                    $estimate->update([
                        'status' => 'invoiced',
                        'notes' => $updatedNotes,
                    ]);
                    return $existing;
                }

                // Generate sequential Proforma Number (PI-YYYY-XXX)
                $proformaNumber = DocumentNumberService::getNextProformaNumber(true);

                $defaultBankDetails = "Bank Name: HDFC Bank Limited\nAccount Name: Kabhyan Technologies Private Limited\nAccount Number: 50200084729184\nIFSC Code: HDFC0001234\nBranch: Salt Lake Sector V, Kolkata, West Bengal\nUPI ID: kabhyan@hdfcbank";

                $newProforma = ProformaInvoice::create([
                    'proforma_number' => $proformaNumber,
                    'estimate_id' => $estimate->id,
                    'project_id' => $estimate->project_id,
                    'created_by' => $estimate->created_by ?? ($user->id ?? null),
                    'client_name' => $estimate->client_name,
                    'client_company' => $estimate->client_company,
                    'client_email' => $estimate->client_email,
                    'client_phone' => $estimate->client_phone,
                    'client_address' => $estimate->client_address,
                    'invoice_date' => now()->toDateString(),
                    'due_date' => now()->addDays(15)->toDateString(),
                    'status' => 'unpaid',
                    'currency' => $estimate->currency ?? 'INR',
                    'tax_calculation_type' => $estimate->tax_calculation_type ?? 'exclusive',
                    'subtotal' => $estimate->subtotal,
                    'tax_rate' => $estimate->tax_rate,
                    'tax_amount' => $estimate->tax_amount,
                    'round_off' => $estimate->round_off ?? 0.00,
                    'discount_type' => $estimate->discount_type,
                    'discount_rate' => $estimate->discount_rate,
                    'discount_amount' => $estimate->discount_amount,
                    'total_amount' => $estimate->total_amount,
                    'paid_amount' => 0.00,
                    'invoiced_amount' => 0.00,
                    'remaining_amount' => $estimate->total_amount,
                    'notes' => $estimate->notes ?? 'Proforma invoice generated upon client quotation approval for project mobilization.',
                    'terms_and_conditions' => $estimate->terms_and_conditions ?? "1. This proforma invoice is issued for payment facilitation.\n2. Please mention the Proforma Number in transaction reference.\n3. Goods/Services will be initiated post receipt of agreed mobilization advance.",
                    'bank_details' => $defaultBankDetails,
                ]);

                // Copy line items from estimate to proforma invoice
                foreach ($estimate->items as $item) {
                    $newProforma->items()->create([
                        'item_name' => $item->item_name,
                        'description' => $item->description,
                        'quantity' => $item->quantity,
                        'unit' => $item->unit,
                        'unit_price' => $item->unit_price,
                        'amount' => $item->amount,
                        'tax_rate' => $item->tax_rate ?? $estimate->tax_rate ?? 18.00,
                        'tax_amount' => $item->tax_amount ?? 0.00,
                    ]);
                }

                // Update estimate status to invoiced
                $estimate->update([
                    'status' => 'invoiced',
                    'notes' => $updatedNotes,
                ]);

                return $newProforma;
            });

            return response()->json([
                'success' => true,
                'message' => "Quotation accepted! Proforma Invoice #{$proforma->proforma_number} has been generated.",
                'estimate' => $estimate->fresh()->load(['proformaInvoices']),
                'proforma_invoice' => $proforma->load(['items']),
            ]);
        }

        $estimate->update([
            'status' => 'declined',
            'notes' => $updatedNotes,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Quotation has been declined.",
            'estimate' => $estimate->fresh(),
        ]);
    }

    /**
     * Generate secure temporary download URL for Estimate PDF.
     */
    public function getEstimatePdfUrl(Request $request, Estimate $estimate)
    {
        $client = $this->getClient($request);
        $user = $request->user();
        $isStaff = in_array($user->role, ['superadmin', 'admin', 'manager', 'hr', 'employee']);

        if (!$isStaff && strcasecmp(trim($estimate->client_email), trim($client->email)) !== 0) {
            abort(403, 'Unauthorized access to this quotation.');
        }
        if ($estimate->status === 'draft') {
            abort(404, 'Quotation is currently in draft preparation.');
        }

        $downloadUrl = URL::temporarySignedRoute(
            'portal.estimate.download-pdf',
            now()->addMinutes(60),
            ['id' => $estimate->id, 'download' => 1]
        );

        return response()->json([
            'download_url' => $downloadUrl,
            'filename' => "Quotation-{$estimate->estimate_number}.pdf",
        ]);
    }

    /**
     * Download Estimate PDF via signed streaming route.
     */
    public function downloadEstimatePdfDirect(Request $request, $id)
    {
        if (! $request->hasValidSignature() && ! $request->hasValidRelativeSignature()) {
            abort(403, 'The download link has expired or has an invalid signature. Please request a new link from the app.');
        }

        $estimate = Estimate::where('id', $id)
            ->orWhere('estimate_number', $id)
            ->firstOrFail();

        if ($estimate->status === 'draft') {
            abort(404, 'Quotation is currently in draft preparation.');
        }

        return app(PdfController::class)->downloadEstimate($request, $estimate->id);
    }

    /**
     * Generate secure temporary download URL for Proforma Invoice PDF.
     */
    public function getProformaPdfUrl(Request $request, ProformaInvoice $proformaInvoice)
    {
        $client = $this->getClient($request);
        if ($proformaInvoice->client_email !== $client->email) {
            abort(403, 'Unauthorized access to this proforma invoice.');
        }
        if ($proformaInvoice->status === 'draft') {
            abort(404, 'Proforma invoice is currently in draft preparation.');
        }

        $downloadUrl = URL::temporarySignedRoute(
            'portal.proforma.download-pdf',
            now()->addMinutes(60),
            ['id' => $proformaInvoice->id, 'download' => 1]
        );

        return response()->json([
            'download_url' => $downloadUrl,
            'filename' => "Proforma-{$proformaInvoice->proforma_number}.pdf",
        ]);
    }

    /**
     * Download Proforma Invoice PDF via signed streaming route.
     */
    public function downloadProformaPdfDirect(Request $request, $id)
    {
        if (! $request->hasValidSignature() && ! $request->hasValidRelativeSignature()) {
            abort(403, 'The download link has expired or has an invalid signature. Please request a new link from the app.');
        }

        $proforma = ProformaInvoice::where('id', $id)
            ->orWhere('proforma_number', $id)
            ->firstOrFail();

        if ($proforma->status === 'draft') {
            abort(404, 'Proforma invoice is currently in draft preparation.');
        }

        return app(PdfController::class)->downloadProforma($request, $proforma->id);
    }

    /**
     * Generate secure temporary download URL for Tax Invoice PDF.
     */
    public function getInvoicePdfUrl(Request $request, Invoice $invoice)
    {
        $client = $this->getClient($request);
        if ($invoice->client_email !== $client->email) {
            abort(403, 'Unauthorized access to this invoice.');
        }
        if ($invoice->status === 'draft') {
            abort(404, 'Invoice is currently in draft preparation.');
        }

        $downloadUrl = URL::temporarySignedRoute(
            'portal.invoice.download-pdf',
            now()->addMinutes(60),
            ['id' => $invoice->id, 'download' => 1]
        );

        return response()->json([
            'download_url' => $downloadUrl,
            'filename' => "Tax-Invoice-{$invoice->invoice_number}.pdf",
        ]);
    }

    /**
     * Download Tax Invoice PDF via signed streaming route.
     */
    public function downloadInvoicePdfDirect(Request $request, $id)
    {
        if (! $request->hasValidSignature() && ! $request->hasValidRelativeSignature()) {
            abort(403, 'The download link has expired or has an invalid signature. Please request a new link from the app.');
        }

        $invoice = Invoice::where('id', $id)
            ->orWhere('invoice_number', $id)
            ->firstOrFail();

        if ($invoice->status === 'draft') {
            abort(404, 'Invoice is currently in draft preparation.');
        }

        return app(PdfController::class)->downloadInvoice($request, $invoice->id);
    }

    /**
     * Generate secure temporary download URL for Receipt Voucher PDF.
     */
    public function getReceiptVoucherPdfUrl(Request $request, ReceiptVoucher $receiptVoucher)
    {
        $client = $this->getClient($request);
        if (strcasecmp(trim($receiptVoucher->client_email), trim($client->email)) !== 0) {
            abort(403, 'Unauthorized access to this receipt voucher.');
        }

        $downloadUrl = URL::temporarySignedRoute(
            'portal.receipt-voucher.download-pdf',
            now()->addMinutes(60),
            ['id' => $receiptVoucher->id, 'download' => 1]
        );

        return response()->json([
            'download_url' => $downloadUrl,
            'filename' => "Receipt-Voucher-{$receiptVoucher->voucher_number}.pdf",
        ]);
    }

    /**
     * Download Receipt Voucher PDF via signed streaming route.
     */
    public function downloadReceiptVoucherPdfDirect(Request $request, $id)
    {
        if (! $request->hasValidSignature() && ! $request->hasValidRelativeSignature()) {
            abort(403, 'The download link has expired or has an invalid signature. Please request a new link from the app.');
        }

        $voucher = ReceiptVoucher::where('id', $id)
            ->orWhere('voucher_number', $id)
            ->firstOrFail();

        return app(PdfController::class)->downloadReceiptVoucher($request, $voucher->id);
    }

    /**
     * Register or update mobile push device token for authenticated user.
     */
    public function registerDeviceToken(Request $request)
    {
        $validated = $request->validate([
            'push_token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:20'],
            'device_name' => ['nullable', 'string', 'max:150'],
        ]);

        $user = $request->user();
        $client = null;
        try {
            $client = $this->getClient($request);
        } catch (\Throwable $e) {
            // User may not be directly tied to client, fallback gracefully
        }

        $token = ClientDeviceToken::registerToken(
            $user,
            $validated['push_token'],
            $validated['platform'] ?? 'android',
            $validated['device_name'] ?? null,
            $client?->id
        );

        return response()->json([
            'success' => true,
            'message' => 'Device token registered successfully',
            'token_id' => $token->id,
        ]);
    }

    /**
     * Deregister / remove mobile push device token on logout.
     */
    public function removeDeviceToken(Request $request)
    {
        $validated = $request->validate([
            'push_token' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $deleted = ClientDeviceToken::removeToken($validated['push_token'], $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Device token removed successfully',
            'deleted' => $deleted,
        ]);
    }
}

