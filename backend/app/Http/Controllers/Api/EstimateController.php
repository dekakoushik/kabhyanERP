<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Estimate;
use App\Models\EstimateItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EstimateController extends Controller
{
    /**
     * List estimates with filters and financial statistics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Estimate::with(['project:id,name,code', 'creator:id,name,email', 'items']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('estimate_number', 'like', "%{$search}%")
                  ->orWhere('client_name', 'like', "%{$search}%")
                  ->orWhere('client_company', 'like', "%{$search}%")
                  ->orWhere('client_email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($projectId = $request->input('project_id')) {
            $query->where('project_id', $projectId);
        }

        $perPage = (int) $request->input('per_page', 15);
        $estimates = $query->latest('estimate_date')->paginate($perPage);

        $stats = [
            'total_estimates' => Estimate::count(),
            'total_value' => (float) Estimate::sum('total_amount'),
            'accepted_value' => (float) Estimate::where('status', 'accepted')->sum('total_amount'),
            'draft' => Estimate::where('status', 'draft')->count(),
            'sent' => Estimate::where('status', 'sent')->count(),
            'accepted' => Estimate::where('status', 'accepted')->count(),
            'declined' => Estimate::where('status', 'declined')->count(),
            'invoiced' => Estimate::where('status', 'invoiced')->count(),
        ];

        return response()->json([
            'estimates' => $estimates,
            'stats' => $stats,
        ]);
    }

    /**
     * Store new estimate with line items.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'estimate_number' => ['required', 'string', 'max:50', 'unique:estimates,estimate_number'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'estimate_date' => ['required', 'date'],
            'expiry_date' => ['nullable', 'date', 'after_or_equal:estimate_date'],
            'status' => ['required', Rule::in(['draft', 'sent', 'accepted', 'declined', 'invoiced'])],
            'currency' => ['required', 'string', 'max:10'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'round_off' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $validated['created_by'] = $request->user()->id;

        $estimate = Estimate::create([
            'estimate_number' => $validated['estimate_number'],
            'project_id' => $validated['project_id'] ?? null,
            'created_by' => $validated['created_by'],
            'client_name' => $validated['client_name'],
            'client_email' => $validated['client_email'] ?? null,
            'client_company' => $validated['client_company'] ?? null,
            'client_phone' => $validated['client_phone'] ?? null,
            'client_address' => $validated['client_address'] ?? null,
            'estimate_date' => $validated['estimate_date'],
            'expiry_date' => $validated['expiry_date'] ?? null,
            'status' => $validated['status'],
            'currency' => $validated['currency'] ?? 'INR',
            'tax_rate' => $validated['tax_rate'] ?? 0,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'round_off' => $validated['round_off'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            $amount = $item['quantity'] * $item['unit_price'];
            $estimate->items()->create([
                'item_name' => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'hours',
                'unit_price' => $item['unit_price'],
                'amount' => $amount,
            ]);
        }

        $estimate->recalculateTotals();

        return response()->json([
            'message' => 'Estimate generated successfully',
            'estimate' => $estimate->fresh()->load(['items', 'project:id,name,code', 'creator:id,name,email']),
        ], 201);
    }

    /**
     * Show single estimate with its itemized breakdown.
     */
    public function show(Estimate $estimate): JsonResponse
    {
        return response()->json([
            'estimate' => $estimate->load(['items', 'project:id,name,code', 'creator:id,name,email']),
        ]);
    }

    /**
     * Update estimate and replace line items.
     */
    public function update(Request $request, Estimate $estimate): JsonResponse
    {
        $validated = $request->validate([
            'estimate_number' => ['required', 'string', 'max:50', Rule::unique('estimates', 'estimate_number')->ignore($estimate->id)],
            'project_id' => ['nullable', 'exists:projects,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['nullable', 'email', 'max:255'],
            'client_company' => ['nullable', 'string', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:50'],
            'client_address' => ['nullable', 'string'],
            'estimate_date' => ['required', 'date'],
            'expiry_date' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['draft', 'sent', 'accepted', 'declined', 'invoiced'])],
            'currency' => ['required', 'string', 'max:10'],
            'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'round_off' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string'],
            'terms_and_conditions' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit' => ['nullable', 'string', 'max:50'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
        ]);

        $estimate->update([
            'estimate_number' => $validated['estimate_number'],
            'project_id' => $validated['project_id'] ?? null,
            'client_name' => $validated['client_name'],
            'client_email' => $validated['client_email'] ?? null,
            'client_company' => $validated['client_company'] ?? null,
            'client_phone' => $validated['client_phone'] ?? null,
            'client_address' => $validated['client_address'] ?? null,
            'estimate_date' => $validated['estimate_date'],
            'expiry_date' => $validated['expiry_date'] ?? null,
            'status' => $validated['status'],
            'currency' => $validated['currency'],
            'tax_rate' => $validated['tax_rate'] ?? 0,
            'discount_rate' => $validated['discount_rate'] ?? 0,
            'round_off' => $validated['round_off'] ?? 0,
            'notes' => $validated['notes'] ?? null,
            'terms_and_conditions' => $validated['terms_and_conditions'] ?? null,
        ]);

        // Recreate items
        $estimate->items()->delete();
        foreach ($validated['items'] as $item) {
            $amount = $item['quantity'] * $item['unit_price'];
            $estimate->items()->create([
                'item_name' => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity' => $item['quantity'],
                'unit' => $item['unit'] ?? 'hours',
                'unit_price' => $item['unit_price'],
                'amount' => $amount,
            ]);
        }

        $estimate->recalculateTotals();

        return response()->json([
            'message' => 'Estimate updated successfully',
            'estimate' => $estimate->fresh()->load(['items', 'project:id,name,code', 'creator:id,name,email']),
        ]);
    }

    /**
     * Fast status update (e.g., mark as Sent, Accepted, Declined).
     */
    public function updateStatus(Request $request, Estimate $estimate): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['draft', 'sent', 'accepted', 'declined', 'invoiced'])],
        ]);

        $estimate->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Estimate status updated to ' . $validated['status'],
            'estimate' => $estimate->fresh(),
        ]);
    }

    /**
     * Delete estimate.
     */
    public function destroy(Estimate $estimate): JsonResponse
    {
        $estimate->delete();

        return response()->json([
            'message' => 'Estimate deleted successfully',
        ]);
    }
}

