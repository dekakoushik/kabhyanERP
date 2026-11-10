<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\InvoicePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    /**
     * List expenses with category and project associations.
     */
    public function index(Request $request)
    {
        $query = Expense::with(['category', 'project', 'creator']);

        if ($request->filled('category_id')) {
            $query->where('expense_category_id', $request->category_id);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('expense_date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('expense_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('vendor_name', 'like', "%{$search}%")
                  ->orWhere('transaction_reference', 'like', "%{$search}%");
            });
        }

        $expenses = $query->orderBy('expense_date', 'desc')->paginate($request->input('per_page', 25));

        $stats = [
            'total_expenses_value' => (float) Expense::where('status', 'paid')->sum('total_amount'),
            'total_tax_deductible' => (float) Expense::where('status', 'paid')->sum('tax_amount'),
            'total_count' => Expense::count(),
            'pending_count' => Expense::where('status', 'pending')->count(),
        ];

        return response()->json([
            'expenses' => $expenses,
            'stats' => $stats,
        ]);
    }

    /**
     * Store new expense.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_gstin' => 'nullable|string|max:30',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'payment_method' => 'nullable|in:bank_transfer,upi,neft,rtgs,corporate_card,cash,cheque',
            'transaction_reference' => 'nullable|string|max:255',
            'status' => 'nullable|in:paid,pending,cancelled',
            'notes' => 'nullable|string',
        ]);

        $amount = (float) $validated['amount'];
        $taxAmount = (float) ($validated['tax_amount'] ?? 0);
        $totalAmount = $amount + $taxAmount;

        // Auto generate expense number if not passed
        $count = Expense::count() + 1;
        $expenseNumber = 'EXP-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        while (Expense::where('expense_number', $expenseNumber)->exists()) {
            $count++;
            $expenseNumber = 'EXP-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        }

        $expense = Expense::create([
            'expense_number' => $expenseNumber,
            'expense_category_id' => $validated['expense_category_id'],
            'project_id' => $validated['project_id'] ?? null,
            'created_by' => $request->user()?->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'vendor_name' => $validated['vendor_name'] ?? null,
            'vendor_gstin' => $validated['vendor_gstin'] ?? null,
            'expense_date' => $validated['expense_date'],
            'amount' => $amount,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'currency' => $validated['currency'] ?? 'INR',
            'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
            'transaction_reference' => $validated['transaction_reference'] ?? null,
            'status' => $validated['status'] ?? 'paid',
            'notes' => $validated['notes'] ?? null,
        ]);

        $expense->load(['category', 'project', 'creator']);

        return response()->json([
            'message' => 'Expense recorded successfully.',
            'expense' => $expense,
        ], 201);
    }

    /**
     * Show single expense.
     */
    public function show(Expense $expense)
    {
        $expense->load(['category', 'project', 'creator']);
        return response()->json(['expense' => $expense]);
    }

    /**
     * Update an expense.
     */
    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'project_id' => 'nullable|exists:projects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'vendor_name' => 'nullable|string|max:255',
            'vendor_gstin' => 'nullable|string|max:30',
            'expense_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'payment_method' => 'nullable|in:bank_transfer,upi,neft,rtgs,corporate_card,cash,cheque',
            'transaction_reference' => 'nullable|string|max:255',
            'status' => 'nullable|in:paid,pending,cancelled',
            'notes' => 'nullable|string',
        ]);

        $amount = (float) $validated['amount'];
        $taxAmount = (float) ($validated['tax_amount'] ?? 0);
        $totalAmount = $amount + $taxAmount;

        $expense->update([
            'expense_category_id' => $validated['expense_category_id'],
            'project_id' => $validated['project_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'vendor_name' => $validated['vendor_name'] ?? null,
            'vendor_gstin' => $validated['vendor_gstin'] ?? null,
            'expense_date' => $validated['expense_date'],
            'amount' => $amount,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'currency' => $validated['currency'] ?? 'INR',
            'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
            'transaction_reference' => $validated['transaction_reference'] ?? null,
            'status' => $validated['status'] ?? $expense->status,
            'notes' => $validated['notes'] ?? null,
        ]);

        $expense->load(['category', 'project', 'creator']);

        return response()->json([
            'message' => 'Expense updated successfully.',
            'expense' => $expense,
        ]);
    }

    /**
     * Delete an expense.
     */
    public function destroy(Expense $expense)
    {
        $expense->delete();
        return response()->json(['message' => 'Expense deleted successfully.']);
    }

    /**
     * Categories list.
     */
    public function categories()
    {
        $categories = ExpenseCategory::where('is_active', true)->withCount('expenses')->get();
        return response()->json(['categories' => $categories]);
    }
}

