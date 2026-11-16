<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\CompanyHoliday;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\MonthlyAttendance;
use App\Models\PayrollBatch;
use App\Models\Payslip;
use App\Models\SalaryStructure;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HrmsController extends Controller
{
    /**
     * HRMS Dashboard Overview.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        $isHrOrAdmin = in_array($user->role, ['superadmin', 'admin', 'hr']);

        $currentMonth = (int) now()->month;
        $currentYear = (int) now()->year;

        // 1. Pending leave requests
        $pendingLeavesQuery = LeaveRequest::with(['user', 'leaveType'])
            ->where('status', 'pending');
        if (!$isHrOrAdmin) {
            $pendingLeavesQuery->where('user_id', $user->id);
        }
        $pendingLeavesCount = (clone $pendingLeavesQuery)->count();
        $recentPendingLeaves = $pendingLeavesQuery->latest()->take(5)->get();

        // 2. Upcoming company holidays
        $upcomingHolidays = CompanyHoliday::where('holiday_date', '>=', now()->toDateString())
            ->orderBy('holiday_date', 'asc')
            ->take(4)
            ->get();

        // 3. Current month payroll status
        $currentPayrollBatch = PayrollBatch::where('month', $currentMonth)
            ->where('year', $currentYear)
            ->first();

        // 4. Staff salary structures status
        $totalStaff = User::whereNull('deleted_at')
            ->where('role', '!=', 'client')
            ->count();
        $staffWithSalary = SalaryStructure::count();

        // 5. User's personal leave balances
        $myLeaveBalances = $this->calculateUserLeaveBalances($user->id, $currentYear);

        return response()->json([
            'date_today' => now()->toFormattedDateString(),
            'current_month' => $currentMonth,
            'current_year' => $currentYear,
            'stats' => [
                'pending_leaves_count' => $pendingLeavesCount,
                'total_staff' => $totalStaff,
                'staff_with_salary' => $staffWithSalary,
                'current_payroll_status' => $currentPayrollBatch ? $currentPayrollBatch->status : 'unprocessed',
                'current_payroll_net' => $currentPayrollBatch ? $currentPayrollBatch->total_net : 0,
            ],
            'recent_pending_leaves' => $recentPendingLeaves,
            'upcoming_holidays' => $upcomingHolidays,
            'current_payroll_batch' => $currentPayrollBatch,
            'my_leave_balances' => $myLeaveBalances,
        ]);
    }

    /**
     * List leave requests with filters.
     */
    public function leaves(Request $request): JsonResponse
    {
        $user = $request->user();
        $isHrOrAdmin = in_array($user->role, ['superadmin', 'admin', 'hr']);

        $query = LeaveRequest::with(['user', 'leaveType', 'approver']);

        if (!$isHrOrAdmin) {
            $query->where('user_id', $user->id);
        } else {
            if ($request->filled('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('year')) {
            $query->whereYear('start_date', $request->input('year'));
        }

        $leaves = $query->latest()->paginate($request->input('per_page', 20));
        $balances = $this->calculateUserLeaveBalances($request->input('user_id', $user->id), (int) ($request->input('year', now()->year)));

        return response()->json([
            'leaves' => $leaves,
            'balances' => $balances,
        ]);
    }

    /**
     * Submit a new leave application.
     */
    public function applyLeave(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_half_day' => 'boolean',
            'half_day_type' => 'nullable|in:first_half,second_half',
            'reason' => 'required|string|max:1000',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        $daysCount = $startDate->diffInDays($endDate) + 1;
        if (!empty($validated['is_half_day'])) {
            $daysCount = 0.5;
        }

        $leave = LeaveRequest::create([
            'user_id' => $request->user()->id,
            'leave_type_id' => $validated['leave_type_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'days_count' => $daysCount,
            'is_half_day' => $validated['is_half_day'] ?? false,
            'half_day_type' => $validated['half_day_type'] ?? null,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Leave application submitted successfully.',
            'leave' => $leave->load(['leaveType']),
        ], 201);
    }

    /**
     * Approve or reject a leave application.
     */
    public function updateLeaveStatus(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $leaveRequest->update([
            'status' => $validated['status'],
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        // If approved and it's unpaid (LOP), automatically sync to monthly attendance
        if ($validated['status'] === 'approved' && $leaveRequest->leaveType && !$leaveRequest->leaveType->is_paid) {
            $month = (int) Carbon::parse($leaveRequest->start_date)->month;
            $year = (int) Carbon::parse($leaveRequest->start_date)->year;

            $att = MonthlyAttendance::firstOrNew([
                'user_id' => $leaveRequest->user_id,
                'month' => $month,
                'year' => $year,
            ]);

            $att->lop_days = (float) $att->lop_days + (float) $leaveRequest->days_count;
            $totalDays = Carbon::create($year, $month, 1)->daysInMonth;
            $att->total_days = $totalDays;
            $att->paid_days = max(0, $totalDays - $att->lop_days);
            $att->save();
        }

        return response()->json([
            'message' => "Leave application marked as {$validated['status']}.",
            'leave' => $leaveRequest->fresh(['user', 'leaveType', 'approver']),
        ]);
    }

    /**
     * List leave types.
     */
    public function leaveTypes(): JsonResponse
    {
        $types = LeaveType::all();
        return response()->json(['leave_types' => $types]);
    }

    /**
     * List company holidays.
     */
    public function holidays(Request $request): JsonResponse
    {
        $year = (int) ($request->input('year', now()->year));
        $holidays = CompanyHoliday::whereYear('holiday_date', $year)
            ->orderBy('holiday_date', 'asc')
            ->get();

        return response()->json([
            'year' => $year,
            'holidays' => $holidays,
        ]);
    }

    /**
     * Store a new company holiday.
     */
    public function storeHoliday(Request $request): JsonResponse
    {
        $input = $request->all();
        if (!empty($input['name']) && empty($input['title'])) {
            $input['title'] = $input['name'];
        }
        if (!empty($input['date']) && empty($input['holiday_date'])) {
            $input['holiday_date'] = $input['date'];
        }

        $validated = validator($input, [
            'title' => 'required|string|max:255',
            'holiday_date' => 'required|date|unique:company_holidays,holiday_date',
            'is_optional' => 'boolean',
            'description' => 'nullable|string|max:500',
        ])->validate();

        $holiday = CompanyHoliday::create($validated);

        return response()->json([
            'message' => 'Holiday added successfully.',
            'holiday' => $holiday,
        ], 201);
    }

    /**
     * Auto-sync Government & Assam State Holidays for selected year or full 2025-2028 spectrum.
     */
    public function syncHolidays(Request $request): JsonResponse
    {
        $yearInput = $request->input('year');
        $year = ($yearInput && $yearInput !== 'all') ? (int) $yearInput : null;
        $region = (string) $request->input('region', 'all');

        $holidays = \App\Services\AssamHolidaysRegistry::getHolidays($year, $region);
        $added = 0;
        $updated = 0;

        foreach ($holidays as $h) {
            $existing = CompanyHoliday::where('holiday_date', $h['holiday_date'])->first();
            if (!$existing) {
                CompanyHoliday::create([
                    'title' => $h['title'],
                    'holiday_date' => $h['holiday_date'],
                    'is_optional' => $h['is_optional'],
                    'description' => $h['description'],
                ]);
                $added++;
            } else {
                $existing->update([
                    'title' => $h['title'],
                    'description' => $h['description'],
                ]);
                $updated++;
            }
        }

        return response()->json([
            'message' => "Successfully synced {$added} new holidays and updated {$updated} existing holidays.",
            'added' => $added,
            'updated' => $updated,
            'total_in_registry' => count($holidays),
        ]);
    }

    /**
     * Delete a holiday.
     */
    public function destroyHoliday(CompanyHoliday $holiday): JsonResponse
    {
        $holiday->delete();
        return response()->json(['message' => 'Holiday removed successfully.']);
    }

    /**
     * Monthly Attendance & LOP Exception Ledger.
     */
    public function monthlyAttendance(Request $request): JsonResponse
    {
        $month = (int) ($request->input('month', now()->month));
        $year = (int) ($request->input('year', now()->year));

        $startOfMonth = Carbon::create($year, $month, 1);
        $totalDaysInMonth = $startOfMonth->daysInMonth;

        // Calculate standard working days (Mon-Fri or Mon-Sat excluding company holidays)
        $holidays = CompanyHoliday::whereYear('holiday_date', $year)
            ->whereMonth('holiday_date', $month)
            ->pluck('holiday_date')
            ->map(fn($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $standardWorkingDays = 0;
        for ($day = 1; $day <= $totalDaysInMonth; $day++) {
            $date = Carbon::create($year, $month, $day);
            // Default 5-day work week (Monday-Friday)
            if (!$date->isWeekend() && !in_array($date->toDateString(), $holidays)) {
                $standardWorkingDays++;
            }
        }

        // Fetch active internal staff
        $staffMembers = User::whereNull('deleted_at')
            ->where('role', '!=', 'client')
            ->with(['customRole'])
            ->get();

        // Fetch existing recorded monthly attendance records
        $existingRecords = MonthlyAttendance::where('month', $month)
            ->where('year', $year)
            ->get()
            ->keyBy('user_id');

        // Fetch approved leaves in this month for all staff
        $approvedLeaves = LeaveRequest::where('status', 'approved')
            ->where(function ($q) use ($startOfMonth, $year, $month, $totalDaysInMonth) {
                $q->whereBetween('start_date', [
                    $startOfMonth->toDateString(),
                    Carbon::create($year, $month, $totalDaysInMonth)->toDateString(),
                ])->orWhereBetween('end_date', [
                    $startOfMonth->toDateString(),
                    Carbon::create($year, $month, $totalDaysInMonth)->toDateString(),
                ]);
            })
            ->with('leaveType')
            ->get()
            ->groupBy('user_id');

        $ledger = $staffMembers->map(function ($staff) use ($existingRecords, $approvedLeaves, $totalDaysInMonth, $standardWorkingDays) {
            $existing = $existingRecords->get($staff->id);
            $userLeaves = $approvedLeaves->get($staff->id) ?? collect();

            $approvedPaidLeaves = 0;
            $approvedUnpaidLeaves = 0;

            foreach ($userLeaves as $l) {
                if ($l->leaveType && $l->leaveType->is_paid) {
                    $approvedPaidLeaves += (float) $l->days_count;
                } else {
                    $approvedUnpaidLeaves += (float) $l->days_count;
                }
            }

            $lopDays = $existing ? (float) $existing->lop_days : $approvedUnpaidLeaves;
            $paidDays = max(0, $totalDaysInMonth - $lopDays);

            return [
                'user_id' => $staff->id,
                'name' => $staff->name,
                'employee_code' => $staff->employee_code,
                'department' => $staff->department,
                'designation' => $staff->designation,
                'total_days' => $totalDaysInMonth,
                'working_days' => $standardWorkingDays,
                'approved_leaves' => $approvedPaidLeaves,
                'lop_days' => $lopDays,
                'paid_days' => $paidDays,
                'notes' => $existing ? $existing->notes : null,
                'record_id' => $existing ? $existing->id : null,
            ];
        });

        return response()->json([
            'month' => $month,
            'year' => $year,
            'total_days' => $totalDaysInMonth,
            'standard_working_days' => $standardWorkingDays,
            'holidays_count' => count($holidays),
            'ledger' => $ledger,
        ]);
    }

    /**
     * Update an employee's LOP or attendance record for a month.
     */
    public function updateMonthlyAttendance(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|between:2020,2035',
            'lop_days' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $totalDays = Carbon::create($validated['year'], $validated['month'], 1)->daysInMonth;
        $paidDays = max(0, $totalDays - (float) $validated['lop_days']);

        $record = MonthlyAttendance::updateOrCreate(
            [
                'user_id' => $user->id,
                'month' => $validated['month'],
                'year' => $validated['year'],
            ],
            [
                'total_days' => $totalDays,
                'lop_days' => $validated['lop_days'],
                'paid_days' => $paidDays,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'message' => "Attendance record for {$user->name} updated successfully.",
            'attendance' => $record,
        ]);
    }

    /**
     * List all staff salary structures.
     */
    public function salaryStructures(): JsonResponse
    {
        $staff = User::whereNull('deleted_at')
            ->where('role', '!=', 'client')
            ->with(['customRole', 'salaryStructure'])
            ->get();

        return response()->json([
            'salary_structures' => $staff,
        ]);
    }

    /**
     * Show salary structure for a specific staff member.
     */
    public function getSalaryStructure(User $user): JsonResponse
    {
        $structure = SalaryStructure::where('user_id', $user->id)->first();
        return response()->json([
            'user' => $user->load(['customRole']),
            'salary_structure' => $structure,
        ]);
    }

    /**
     * Store or update salary structure (CTC breakdown).
     */
    public function storeSalaryStructure(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'ctc_annual' => 'required|numeric|min:0',
            'basic_monthly' => 'nullable|numeric|min:0',
            'hra_monthly' => 'nullable|numeric|min:0',
            'special_allowance' => 'nullable|numeric|min:0',
            'conveyance_allowance' => 'nullable|numeric|min:0',
            'pf_employee' => 'nullable|numeric|min:0',
            'professional_tax' => 'nullable|numeric|min:0',
            'tds_monthly' => 'nullable|numeric|min:0',
            'effective_from' => 'nullable|date',
        ]);

        $ctcAnnual = (float) $validated['ctc_annual'];
        $grossMonthly = $ctcAnnual / 12;

        // Auto-calculate statutory standard breakdown if components are zero or not provided
        $basic = !empty($validated['basic_monthly']) ? (float) $validated['basic_monthly'] : round($grossMonthly * 0.50, 2);
        $hra = !empty($validated['hra_monthly']) ? (float) $validated['hra_monthly'] : round($grossMonthly * 0.25, 2);
        $conveyance = !empty($validated['conveyance_allowance']) ? (float) $validated['conveyance_allowance'] : 1600.00;
        $special = !empty($validated['special_allowance']) ? (float) $validated['special_allowance'] : max(0, round($grossMonthly - $basic - $hra - $conveyance, 2));

        // Deductions
        $pf = !empty($validated['pf_employee']) ? (float) $validated['pf_employee'] : round(min($basic * 0.12, 1800), 2);
        $pt = isset($validated['professional_tax']) ? (float) $validated['professional_tax'] : 200.00;
        $tds = !empty($validated['tds_monthly']) ? (float) $validated['tds_monthly'] : 0.00;

        $structure = SalaryStructure::updateOrCreate(
            ['user_id' => $validated['user_id']],
            [
                'ctc_annual' => $ctcAnnual,
                'basic_monthly' => $basic,
                'hra_monthly' => $hra,
                'special_allowance' => $special,
                'conveyance_allowance' => $conveyance,
                'pf_employee' => $pf,
                'professional_tax' => $pt,
                'tds_monthly' => $tds,
                'effective_from' => $validated['effective_from'] ?? now()->toDateString(),
            ]
        );

        return response()->json([
            'message' => 'Salary structure saved successfully.',
            'salary_structure' => $structure,
        ]);
    }

    /**
     * Payroll Batches Overview.
     */
    public function payrollOverview(Request $request): JsonResponse
    {
        $batches = PayrollBatch::with(['finalizer'])
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        $stats = [
            'total_batches' => $batches->count(),
            'total_disbursed' => $batches->where('status', 'paid')->sum('total_net'),
            'pending_drafts' => $batches->where('status', 'draft')->count(),
        ];

        return response()->json([
            'batches' => $batches,
            'stats' => $stats,
        ]);
    }

    /**
     * Calculate and preview payroll for a month before finalizing.
     */
    public function payrollCalculate(Request $request): JsonResponse
    {
        $month = (int) ($request->input('month', now()->month));
        $year = (int) ($request->input('year', now()->year));

        $startOfMonth = Carbon::create($year, $month, 1);
        $totalDaysInMonth = $startOfMonth->daysInMonth;

        $staff = User::whereNull('deleted_at')
            ->where('role', '!=', 'client')
            ->with(['customRole', 'salaryStructure'])
            ->get();

        $attendances = MonthlyAttendance::where('month', $month)
            ->where('year', $year)
            ->get()
            ->keyBy('user_id');

        $preview = [];
        $totalGross = 0;
        $totalDeductions = 0;
        $totalNet = 0;

        foreach ($staff as $s) {
            $structure = $s->salaryStructure;
            if (!$structure) {
                $preview[] = [
                    'user_id' => $s->id,
                    'name' => $s->name,
                    'employee_code' => $s->employee_code,
                    'has_salary_structure' => false,
                    'gross' => 0,
                    'deductions' => 0,
                    'net' => 0,
                    'lop_days' => 0,
                    'paid_days' => $totalDaysInMonth,
                ];
                continue;
            }

            $att = $attendances->get($s->id);
            $lopDays = $att ? (float) $att->lop_days : 0;
            $paidDays = max(0, $totalDaysInMonth - $lopDays);

            $grossMonthly = (float) ($structure->basic_monthly + $structure->hra_monthly + $structure->special_allowance + $structure->conveyance_allowance);
            
            // Daily wage calculation for Loss of Pay (LOP)
            $dailyWage = $totalDaysInMonth > 0 ? $grossMonthly / $totalDaysInMonth : 0;
            $lopDeduction = round($dailyWage * $lopDays, 2);

            $statutoryDeductions = (float) ($structure->pf_employee + $structure->professional_tax + $structure->tds_monthly);
            $userTotalDeductions = round($statutoryDeductions + $lopDeduction, 2);
            $netPay = max(0, round($grossMonthly - $userTotalDeductions, 2));

            $totalGross += $grossMonthly;
            $totalDeductions += $userTotalDeductions;
            $totalNet += $netPay;

            $preview[] = [
                'user_id' => $s->id,
                'name' => $s->name,
                'employee_code' => $s->employee_code,
                'department' => $s->department,
                'designation' => $s->designation,
                'has_salary_structure' => true,
                'basic' => (float) $structure->basic_monthly,
                'hra' => (float) $structure->hra_monthly,
                'allowances' => (float) ($structure->special_allowance + $structure->conveyance_allowance),
                'gross' => $grossMonthly,
                'pf' => (float) $structure->pf_employee,
                'pt' => (float) $structure->professional_tax,
                'tds' => (float) $structure->tds_monthly,
                'lop_days' => $lopDays,
                'lop_deduction' => $lopDeduction,
                'total_deductions' => $userTotalDeductions,
                'net' => $netPay,
                'total_days' => $totalDaysInMonth,
                'paid_days' => $paidDays,
            ];
        }

        return response()->json([
            'month' => $month,
            'year' => $year,
            'total_days' => $totalDaysInMonth,
            'total_gross' => round($totalGross, 2),
            'total_deductions' => round($totalDeductions, 2),
            'total_net' => round($totalNet, 2),
            'staff_count' => count($preview),
            'records' => $preview,
        ]);
    }

    /**
     * Generate Monthly Payroll Batch & Individual Payslips.
     */
    public function payrollGenerate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|between:2020,2035',
        ]);

        $month = (int) $validated['month'];
        $year = (int) $validated['year'];

        $existing = PayrollBatch::where('month', $month)->where('year', $year)->first();
        if ($existing && in_array($existing->status, ['finalized', 'paid'])) {
            return response()->json([
                'message' => "Payroll for {$month}/{$year} is already {$existing->status} and locked.",
            ], 422);
        }

        $calc = $this->payrollCalculate($request)->getData(true);

        DB::beginTransaction();
        try {
            $batchNumber = "PAY-" . $year . "-" . str_pad((string) $month, 2, "0", STR_PAD_LEFT);

            $batch = PayrollBatch::updateOrCreate(
                ['month' => $month, 'year' => $year],
                [
                    'batch_number' => $batchNumber,
                    'total_gross' => $calc['total_gross'],
                    'total_deductions' => $calc['total_deductions'],
                    'total_net' => $calc['total_net'],
                    'staff_count' => count(array_filter($calc['records'], fn($r) => $r['has_salary_structure'])),
                    'status' => 'draft',
                ]
            );

            // Generate or update itemized payslips
            foreach ($calc['records'] as $record) {
                if (!$record['has_salary_structure']) continue;

                $payslipNumber = "PSL-" . $year . str_pad((string) $month, 2, "0", STR_PAD_LEFT) . "-" . str_pad((string) $record['user_id'], 4, "0", STR_PAD_LEFT);

                Payslip::updateOrCreate(
                    [
                        'user_id' => $record['user_id'],
                        'month' => $month,
                        'year' => $year,
                    ],
                    [
                        'payroll_batch_id' => $batch->id,
                        'payslip_number' => $payslipNumber,
                        'basic_salary' => $record['basic'],
                        'hra' => $record['hra'],
                        'allowances' => $record['allowances'],
                        'bonus' => 0.00,
                        'gross_earnings' => $record['gross'],
                        'pf_deduction' => $record['pf'],
                        'pt_deduction' => $record['pt'],
                        'tds_deduction' => $record['tds'],
                        'lop_deduction' => $record['lop_deduction'],
                        'total_deductions' => $record['total_deductions'],
                        'net_pay' => $record['net'],
                        'total_days' => $record['total_days'],
                        'paid_days' => $record['paid_days'],
                        'lop_days' => $record['lop_days'],
                        'payment_status' => 'unpaid',
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'message' => "Payroll batch for {$month}/{$year} generated successfully.",
                'batch' => $batch->load('payslips.user'),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to generate payroll: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Finalize and lock a payroll batch.
     */
    public function payrollFinalize(Request $request, PayrollBatch $batch): JsonResponse
    {
        $batch->update([
            'status' => 'finalized',
            'finalized_at' => now(),
            'finalized_by' => $request->user()?->id ?? Auth::id(),
        ]);

        return response()->json([
            'message' => "Payroll batch {$batch->batch_number} finalized and locked.",
            'batch' => $batch,
        ]);
    }

    /**
     * Record payment and mark batch and payslips as paid.
     */
    public function payrollDisburse(Request $request, PayrollBatch $batch): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:bank_transfer,neft,imps,upi',
            'transaction_reference' => 'nullable|string|max:100',
        ]);

        DB::beginTransaction();
        try {
            $batch->update(['status' => 'paid']);

            Payslip::where('payroll_batch_id', $batch->id)->update([
                'payment_status' => 'paid',
                'payment_method' => $validated['payment_method'],
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'paid_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => "Payroll batch {$batch->batch_number} marked as Paid.",
                'batch' => $batch,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Disbursement failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Fetch payslip details for rendering/printing.
     */
    public function payslipShow(Request $request, $id): JsonResponse
    {
        $payslip = Payslip::with(['user', 'batch.finalizer'])->findOrFail($id);

        // Security: non-admin can only view their own payslip
        $currentUser = $request->user() ?? Auth::user();
        if ($currentUser && !in_array($currentUser->role, ['superadmin', 'admin', 'hr']) && $payslip->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Unauthorized access to payslip.'], 403);
        }

        // Fetch company profile settings
        $companySettings = [
            'company_name' => SystemSetting::get('company_name', 'Kabhyan Technologies Private Limited'),
            'company_address' => SystemSetting::get('company_address', 'Kolkata, West Bengal, India'),
            'company_email' => SystemSetting::get('company_email', 'support@kabhyan.com'),
            'company_phone' => SystemSetting::get('company_phone', '+91 98200 12345'),
            'company_gstin' => SystemSetting::get('company_gstin', '18AAGCK2934D1Z2'),
            'logo_url' => SystemSetting::get('logo_primary', '/logo.png'),
        ];

        return response()->json([
            'payslip' => $payslip,
            'company' => $companySettings,
        ]);
    }

    /**
     * Fetch payslips for currently logged-in user.
     */
    public function myPayslips(Request $request): JsonResponse
    {
        $payslips = Payslip::where('user_id', $request->user()->id)
            ->with(['batch'])
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json(['payslips' => $payslips]);
    }

    /**
     * Helper: calculate user's leave balances for a year.
     */
    private function calculateUserLeaveBalances(int $userId, int $year): array
    {
        $leaveTypes = LeaveType::all();
        $approvedLeaves = LeaveRequest::where('user_id', $userId)
            ->where('status', 'approved')
            ->whereYear('start_date', $year)
            ->selectRaw('leave_type_id, SUM(days_count) as total_days')
            ->groupBy('leave_type_id')
            ->pluck('total_days', 'leave_type_id')
            ->toArray();

        $balances = [];
        foreach ($leaveTypes as $type) {
            $used = (float) ($approvedLeaves[$type->id] ?? 0);
            $balances[] = [
                'leave_type_id' => $type->id,
                'name' => $type->name,
                'code' => $type->code,
                'is_paid' => $type->is_paid,
                'annual_quota' => $type->annual_quota,
                'used' => $used,
                'remaining' => $type->is_paid ? max(0, $type->annual_quota - $used) : 0,
            ];
        }

        return $balances;
    }
}
