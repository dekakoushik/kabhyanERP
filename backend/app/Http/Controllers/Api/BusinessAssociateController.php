<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessAssociate;
use App\Models\BusinessAssociateDocument;
use App\Models\BusinessAssociatePayout;
use App\Models\Client;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class BusinessAssociateController extends Controller
{
    /**
     * Display a listing of Business Associates with metric counters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = BusinessAssociate::query();

        // Search by keyword
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('associate_code', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('city', 'like', "%{$s}%");
            });
        }

        // Filter by engagement model
        if ($request->filled('engagement_model') && $request->engagement_model !== 'all') {
            $query->where('engagement_model', $request->engagement_model);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by partner tier
        if ($request->filled('partner_tier') && $request->partner_tier !== 'all') {
            $query->where('partner_tier', $request->partner_tier);
        }

        // Global stats calculated across all associates
        $baseStats = BusinessAssociate::query();
        $stats = [
            'total_associates' => (clone $baseStats)->count(),
            'active_associates' => (clone $baseStats)->where('status', 'active')->count(),
            'salary_model_count' => (clone $baseStats)->whereIn('engagement_model', ['salary', 'hybrid'])->count(),
            'commission_model_count' => (clone $baseStats)->whereIn('engagement_model', ['commission', 'hybrid'])->count(),
            'total_payouts_disbursed' => (float) BusinessAssociatePayout::where('status', 'paid')->sum('net_amount'),
            'pending_payouts_count' => BusinessAssociatePayout::where('status', 'pending')->count(),
            'pending_payouts_amount' => (float) BusinessAssociatePayout::where('status', 'pending')->sum('net_amount'),
        ];

        $associates = $query->withCount(['clients', 'payouts'])
            ->withSum(['payouts as total_paid' => function ($q) {
                $q->where('status', 'paid');
            }], 'net_amount')
            ->orderBy('id', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json([
            'associates' => $associates,
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly onboarded Business Associate.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:business_associates,email'],
            'phone' => ['required', 'string', 'max:30'],
            'emergency_contact' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'pan_number' => ['nullable', 'string', 'max:10'],
            'gstin' => ['nullable', 'string', 'max:15'],
            'engagement_model' => ['required', Rule::in(['salary', 'commission', 'hybrid'])],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_basis' => ['nullable', Rule::in(['taxable_turnover', 'gross_amount'])],
            'commission_scope' => ['nullable', Rule::in(['one_time', 'recurring'])],
            'status' => ['required', Rule::in(['active', 'probation', 'inactive', 'terminated'])],
            'joining_date' => ['required', 'date'],
            'contract_end_date' => ['nullable', 'date', 'after_or_equal:joining_date'],
            'bank_name' => ['nullable', 'string', 'max:150'],
            'bank_account_name' => ['nullable', 'string', 'max:150'],
            'bank_account_number' => ['nullable', 'string', 'max:50'],
            'bank_ifsc' => ['nullable', 'string', 'max:20'],
            'bank_upi_id' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $code = BusinessAssociate::generateNextCode();

        $associate = BusinessAssociate::create([
            'associate_code' => $code,
            'name' => $validated['name'],
            'email' => !empty($validated['email']) ? strtolower(trim($validated['email'])) : null,
            'phone' => $validated['phone'],
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? 'Assam',
            'pincode' => $validated['pincode'] ?? null,
            'pan_number' => !empty($validated['pan_number']) ? strtoupper(trim($validated['pan_number'])) : null,
            'gstin' => !empty($validated['gstin']) ? strtoupper(trim($validated['gstin'])) : null,
            'engagement_model' => $validated['engagement_model'],
            'base_salary' => $validated['base_salary'] ?? 0.00,
            'commission_rate' => $validated['commission_rate'] ?? 0.00,
            'commission_basis' => $validated['commission_basis'] ?? 'taxable_turnover',
            'commission_scope' => $validated['commission_scope'] ?? 'recurring',
            'partner_tier' => 'bronze',
            'status' => $validated['status'],
            'joining_date' => $validated['joining_date'],
            'contract_end_date' => $validated['contract_end_date'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_name' => $validated['bank_account_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'bank_ifsc' => !empty($validated['bank_ifsc']) ? strtoupper(trim($validated['bank_ifsc'])) : null,
            'bank_upi_id' => $validated['bank_upi_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Business Associate onboarded successfully',
            'associate' => $associate,
        ], 201);
    }

    /**
     * Display the specified associate dossier with referred clients and payout ledger.
     */
    public function show(BusinessAssociate $businessAssociate): JsonResponse
    {
        // Sync tier dynamically based on actual revenue
        try {
            $businessAssociate->syncPartnerTier();
        } catch (\Throwable $e) {
            // Non-blocking sync fallback
        }

        // 1. Referred Clients with their revenue summary
        $referredClients = Client::where('business_associate_id', $businessAssociate->id)
            ->select('id', 'name', 'company_name', 'email', 'phone', 'city', 'portal_access_status as status', 'created_at')
            ->withCount(['invoices as total_invoices_count'])
            ->withSum(['invoices as total_revenue_paid' => function ($q) {
                $q->where('status', 'paid');
            }], 'total_amount')
            ->latest()
            ->get();

        // 2. Payouts Ledger
        $payouts = BusinessAssociatePayout::where('business_associate_id', $businessAssociate->id)
            ->with(['client:id,name,company_name', 'invoice:id,invoice_number,total_amount,subtotal'])
            ->latest()
            ->get();

        // 3. Document Vault
        $documents = BusinessAssociateDocument::where('business_associate_id', $businessAssociate->id)
            ->latest()
            ->get();

        // 4. Financial Performance Metrics
        $totalSalesDriven = (float) $referredClients->sum('total_revenue_paid');
        $totalPaidPayouts = (float) $payouts->where('status', 'paid')->sum('net_amount');
        $pendingPayouts = (float) $payouts->where('status', 'pending')->sum('net_amount');
        $lifetimeGrossEarnings = (float) $payouts->whereIn('status', ['paid', 'approved'])->sum('gross_amount');
        $totalTdsWithheld = (float) $payouts->whereIn('status', ['paid', 'approved'])->sum('tds_amount');

        return response()->json([
            'associate' => $businessAssociate->fresh(),
            'referred_clients' => $referredClients,
            'payouts' => $payouts,
            'documents' => $documents,
            'metrics' => [
                'total_clients_referred' => $referredClients->count(),
                'total_sales_driven' => $totalSalesDriven,
                'total_paid_payouts' => $totalPaidPayouts,
                'pending_payouts' => $pendingPayouts,
                'lifetime_gross_earnings' => $lifetimeGrossEarnings,
                'total_tds_withheld' => $totalTdsWithheld,
            ],
        ]);
    }

    /**
     * Update the specified Business Associate.
     */
    public function update(Request $request, BusinessAssociate $businessAssociate): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('business_associates', 'email')->ignore($businessAssociate->id)],
            'phone' => ['required', 'string', 'max:30'],
            'emergency_contact' => ['nullable', 'string', 'max:100'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:20'],
            'pan_number' => ['nullable', 'string', 'max:10'],
            'gstin' => ['nullable', 'string', 'max:15'],
            'engagement_model' => ['required', Rule::in(['salary', 'commission', 'hybrid'])],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'commission_basis' => ['nullable', Rule::in(['taxable_turnover', 'gross_amount'])],
            'commission_scope' => ['nullable', Rule::in(['one_time', 'recurring'])],
            'status' => ['required', Rule::in(['active', 'probation', 'inactive', 'terminated'])],
            'joining_date' => ['required', 'date'],
            'contract_end_date' => ['nullable', 'date'],
            'bank_name' => ['nullable', 'string', 'max:150'],
            'bank_account_name' => ['nullable', 'string', 'max:150'],
            'bank_account_number' => ['nullable', 'string', 'max:50'],
            'bank_ifsc' => ['nullable', 'string', 'max:20'],
            'bank_upi_id' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        $businessAssociate->update([
            'name' => $validated['name'],
            'email' => !empty($validated['email']) ? strtolower(trim($validated['email'])) : null,
            'phone' => $validated['phone'],
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? $businessAssociate->state,
            'pincode' => $validated['pincode'] ?? null,
            'pan_number' => !empty($validated['pan_number']) ? strtoupper(trim($validated['pan_number'])) : null,
            'gstin' => !empty($validated['gstin']) ? strtoupper(trim($validated['gstin'])) : null,
            'engagement_model' => $validated['engagement_model'],
            'base_salary' => $validated['base_salary'] ?? 0.00,
            'commission_rate' => $validated['commission_rate'] ?? 0.00,
            'commission_basis' => $validated['commission_basis'] ?? 'taxable_turnover',
            'commission_scope' => $validated['commission_scope'] ?? 'recurring',
            'status' => $validated['status'],
            'joining_date' => $validated['joining_date'],
            'contract_end_date' => $validated['contract_end_date'] ?? null,
            'bank_name' => $validated['bank_name'] ?? null,
            'bank_account_name' => $validated['bank_account_name'] ?? null,
            'bank_account_number' => $validated['bank_account_number'] ?? null,
            'bank_ifsc' => !empty($validated['bank_ifsc']) ? strtoupper(trim($validated['bank_ifsc'])) : null,
            'bank_upi_id' => $validated['bank_upi_id'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $businessAssociate->syncPartnerTier();

        return response()->json([
            'message' => 'Associate profile updated successfully',
            'associate' => $businessAssociate->fresh(),
        ]);
    }

    /**
     * Remove the specified Business Associate.
     */
    public function destroy(BusinessAssociate $businessAssociate): JsonResponse
    {
        $businessAssociate->delete();

        return response()->json([
            'message' => 'Business Associate removed successfully',
        ]);
    }

    /**
     * Record a manual or monthly salary/commission payout.
     */
    public function storePayout(Request $request, BusinessAssociate $businessAssociate): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['salary', 'commission', 'bonus', 'reimbursement'])],
            'gross_amount' => ['required', 'numeric', 'min:1'],
            'tds_rate' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'period_month' => ['nullable', 'string', 'max:7'], // YYYY-MM
            'client_id' => ['nullable', 'exists:clients,id'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'payment_method' => ['required', Rule::in(['bank_transfer', 'upi', 'cheque', 'cash'])],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'status' => ['required', Rule::in(['pending', 'approved', 'paid'])],
            'notes' => ['nullable', 'string'],
        ]);

        $gross = (float) $validated['gross_amount'];
        
        // Auto default TDS rate to 5% if PAN present, else 20%, or user override
        $tdsRate = isset($validated['tds_rate']) 
            ? (float) $validated['tds_rate']
            : ($businessAssociate->pan_number ? 5.00 : 20.00);

        $tdsAmount = round($gross * ($tdsRate / 100), 2);
        $netAmount = round($gross - $tdsAmount, 2);

        $payoutNumber = BusinessAssociatePayout::generateNextPayoutNumber();

        $payout = BusinessAssociatePayout::create([
            'payout_number' => $payoutNumber,
            'business_associate_id' => $businessAssociate->id,
            'client_id' => $validated['client_id'] ?? null,
            'invoice_id' => $validated['invoice_id'] ?? null,
            'type' => $validated['type'],
            'period_month' => $validated['period_month'] ?? date('Y-m'),
            'gross_amount' => $gross,
            'tds_rate' => $tdsRate,
            'tds_amount' => $tdsAmount,
            'net_amount' => $netAmount,
            'status' => $validated['status'],
            'payment_method' => $validated['payment_method'],
            'reference_number' => $validated['reference_number'] ?? null,
            'paid_at' => $validated['status'] === 'paid' ? now() : null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Associate payout recorded successfully',
            'payout' => $payout->load(['client:id,name,company_name', 'invoice:id,invoice_number']),
        ], 201);
    }

    /**
     * Update the status of a payout (e.g. approve or mark as paid with Bank UTR).
     */
    public function updatePayoutStatus(Request $request, int $payoutId): JsonResponse
    {
        $payout = BusinessAssociatePayout::findOrFail($payoutId);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'paid', 'cancelled'])],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'payment_method' => ['nullable', Rule::in(['bank_transfer', 'upi', 'cheque', 'cash'])],
            'notes' => ['nullable', 'string'],
        ]);

        $updateData = [
            'status' => $validated['status'],
        ];

        if (!empty($validated['reference_number'])) {
            $updateData['reference_number'] = $validated['reference_number'];
        }
        if (!empty($validated['payment_method'])) {
            $updateData['payment_method'] = $validated['payment_method'];
        }
        if (isset($validated['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }

        if ($validated['status'] === 'paid' && !$payout->paid_at) {
            $updateData['paid_at'] = now();
        }

        $payout->update($updateData);

        return response()->json([
            'message' => "Payout status updated to {$validated['status']}",
            'payout' => $payout->fresh()->load(['client:id,name,company_name', 'invoice:id,invoice_number']),
        ]);
    }

    /**
     * Upload an agreement, NDA, or KYC document.
     */
    public function uploadDocument(Request $request, BusinessAssociate $businessAssociate): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'document_type' => ['required', Rule::in(['contract', 'nda', 'pan', 'kyc', 'other'])],
            'file' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'], // 10MB
            'expiry_date' => ['nullable', 'date'],
        ]);

        $file = $request->file('file');
        $fileName = 'ba_' . $businessAssociate->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $destinationPath = public_path('storage/associates/documents');

        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0775, true);
        }

        $file->move($destinationPath, $fileName);
        $publicUrl = '/storage/associates/documents/' . $fileName;

        $doc = BusinessAssociateDocument::create([
            'business_associate_id' => $businessAssociate->id,
            'title' => $validated['title'],
            'document_type' => $validated['document_type'],
            'file_path' => $publicUrl,
            'file_size' => round($file->getSize() / 1024, 1) . ' KB',
            'expiry_date' => $validated['expiry_date'] ?? null,
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $doc,
        ], 201);
    }

    /**
     * Delete an uploaded agreement/document.
     */
    public function deleteDocument(int $documentId): JsonResponse
    {
        $doc = BusinessAssociateDocument::findOrFail($documentId);
        
        $filePath = public_path(ltrim($doc->file_path, '/'));
        if (file_exists($filePath)) {
            @unlink($filePath);
        }

        $doc->delete();

        return response()->json([
            'message' => 'Document removed successfully',
        ]);
    }
}
