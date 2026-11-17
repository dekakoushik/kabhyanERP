<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

use App\Models\CompanyHoliday;
use App\Models\DailyAttendance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\MonthlyAttendance;
use App\Models\OfficeGeofence;
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
        try {
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

            $leaves = $query->latest()->paginate($request->input('per_page', 50));
            $balances = $this->calculateUserLeaveBalances($request->input('user_id', $user->id), (int) ($request->input('year', now()->year)));

            return response()->json([
                'leaves' => $leaves->items(),
                'data' => $leaves->items(),
                'pagination' => [
                    'current_page' => $leaves->currentPage(),
                    'last_page' => $leaves->lastPage(),
                    'per_page' => $leaves->perPage(),
                    'total' => $leaves->total(),
                ],
                'balances' => $balances,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Leaves list error: ' . $e->getMessage());
            return response()->json([
                'leaves' => [],
                'data' => [],
                'pagination' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => 50,
                    'total' => 0,
                ],
                'balances' => [],
                'error' => $e->getMessage(),
            ], 200);
        }
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
    /**
     * Parse month & year from request safely (supports '2026-11' or separate month/year).
     */
    private function parseMonthYear(Request $request): array
    {
        $monthInput = $request->input('month');
        if (is_string($monthInput) && str_contains($monthInput, '-')) {
            $parts = explode('-', $monthInput);
            $year = (int) $parts[0];
            $month = (int) $parts[1];
        } else {
            $month = (int) ($monthInput ?: now()->month);
            $year = (int) ($request->input('year') ?: now()->year);
        }

        if ($month < 1 || $month > 12) $month = (int) now()->month;
        if ($year < 2020 || $year > 2035) $year = (int) now()->year;

        return [$month, $year];
    }

    /**
     * Monthly Attendance & LOP Exception Ledger.
     */
    public function monthlyAttendance(Request $request): JsonResponse
    {
        [$month, $year] = $this->parseMonthYear($request);

        $startOfMonth = Carbon::create($year, $month, 1);
        $totalDaysInMonth = $startOfMonth->daysInMonth;

        // Calculate standard working days (Mon-Fri excluding gazetted holidays)
        $holidays = CompanyHoliday::whereYear('holiday_date', $year)
            ->whereMonth('holiday_date', $month)
            ->where('is_optional', false)
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
            ->with(['customRole', 'salaryStructure'])
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
            $paidDays = max(0, $standardWorkingDays - $lopDays);

            return [
                'user_id' => $staff->id,
                'name' => $staff->name,
                'user' => [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'department' => $staff->department ?? 'General Staff',
                ],
                'employee_code' => $staff->employee_code,
                'department' => $staff->department ?? 'General Staff',
                'designation' => $staff->designation,
                'has_salary_structure' => (bool) $staff->salaryStructure,
                'total_days' => $totalDaysInMonth,
                'working_days' => $standardWorkingDays,
                'approved_leaves' => $approvedPaidLeaves,
                'approved_leaves_count' => $approvedPaidLeaves,
                'lop_days' => $lopDays,
                'loss_of_pay_days' => $lopDays,
                'paid_days' => $paidDays,
                'notes' => $existing ? $existing->notes : null,
                'record_id' => $existing ? $existing->id : null,
            ];
        });

        return response()->json([
            'month' => sprintf('%04d-%02d', $year, $month),
            'month_number' => $month,
            'year' => $year,
            'total_days' => $totalDaysInMonth,
            'standard_working_days' => $standardWorkingDays,
            'working_days' => $standardWorkingDays,
            'holidays_count' => count($holidays),
            'ledger' => $ledger,
        ]);
    }

    /**
     * Update an employee's LOP or attendance record for a month (supports both PATCH and POST).
     */
    public function updateMonthlyAttendance(Request $request, ?User $user = null): JsonResponse
    {
        $userId = $user?->id ?? $request->input('user_id');
        if (!$userId) {
            return response()->json(['message' => 'Employee ID is required.'], 422);
        }

        $targetUser = User::findOrFail($userId);
        [$month, $year] = $this->parseMonthYear($request);

        $startOfMonth = Carbon::create($year, $month, 1);
        $totalDaysInMonth = $startOfMonth->daysInMonth;

        // Determine LOP days
        $lopDays = $request->input('lop_days', $request->input('loss_of_pay_days'));
        if ($lopDays === null && $request->has('paid_days')) {
            // Derive LOP from paid days
            $standardWorking = (int) $request->input('working_days', 22);
            $lopDays = max(0, $standardWorking - (float) $request->input('paid_days'));
        }
        $lopDays = max(0, (float) ($lopDays ?? 0));

        $paidDays = max(0, $totalDaysInMonth - $lopDays);
        if ($request->has('paid_days')) {
            $paidDays = (float) $request->input('paid_days');
        }

        $record = MonthlyAttendance::updateOrCreate(
            [
                'user_id' => $targetUser->id,
                'month' => $month,
                'year' => $year,
            ],
            [
                'total_days' => $totalDaysInMonth,
                'lop_days' => $lopDays,
                'paid_days' => $paidDays,
                'notes' => $request->input('notes'),
            ]
        );

        return response()->json([
            'message' => "Attendance record for {$targetUser->name} updated successfully.",
            'attendance' => $record,
            'lop_days' => $lopDays,
            'paid_days' => $paidDays,
        ]);
    }

    /**
     * Bulk Quick-Fill Attendance for all staff for a given month.
     */
    public function quickFillAttendance(Request $request): JsonResponse
    {
        [$month, $year] = $this->parseMonthYear($request);
        $action = $request->input('action', 'mark_all_present'); // 'mark_all_present' or 'reset_to_leaves'

        $startOfMonth = Carbon::create($year, $month, 1);
        $totalDaysInMonth = $startOfMonth->daysInMonth;

        $staffMembers = User::whereNull('deleted_at')
            ->where('role', '!=', 'client')
            ->get();

        foreach ($staffMembers as $staff) {
            $lop = 0.0;
            if ($action === 'reset_to_leaves') {
                $unpaidLeaves = LeaveRequest::where('user_id', $staff->id)
                    ->where('status', 'approved')
                    ->whereHas('leaveType', fn($q) => $q->where('is_paid', false))
                    ->where(function ($q) use ($startOfMonth, $year, $month, $totalDaysInMonth) {
                        $q->whereBetween('start_date', [
                            $startOfMonth->toDateString(),
                            Carbon::create($year, $month, $totalDaysInMonth)->toDateString(),
                        ])->orWhereBetween('end_date', [
                            $startOfMonth->toDateString(),
                            Carbon::create($year, $month, $totalDaysInMonth)->toDateString(),
                        ]);
                    })
                    ->sum('days_count');
                $lop = (float) $unpaidLeaves;
            }

            MonthlyAttendance::updateOrCreate(
                [
                    'user_id' => $staff->id,
                    'month' => $month,
                    'year' => $year,
                ],
                [
                    'total_days' => $totalDaysInMonth,
                    'lop_days' => $lop,
                    'paid_days' => max(0, $totalDaysInMonth - $lop),
                    'notes' => $action === 'mark_all_present' ? 'Bulk marked 100% present' : 'Synced with approved leaves',
                ]
            );
        }

        return response()->json([
            'message' => 'Attendance for all staff members updated successfully.',
            'month' => sprintf('%04d-%02d', $year, $month),
            'action' => $action,
        ]);
    }

    /**
     * Daily attendance roster (Mobile & ERP View).
     */
    public function dailyAttendance(Request $request): JsonResponse
    {
        $dateStr = $request->input('date', now()->toDateString());
        $date = Carbon::parse($dateStr)->toDateString();

        $staffMembers = User::whereNull('deleted_at')
            ->where('role', '!=', 'client')
            ->with(['customRole'])
            ->get();

        $records = DailyAttendance::where('attendance_date', $date)
            ->with('overrider')
            ->get()
            ->keyBy('user_id');

        $roster = $staffMembers->map(function ($staff) use ($records, $date) {
            $rec = $records->get($staff->id);
            return [
                'user_id' => $staff->id,
                'name' => $staff->name,
                'user' => [
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'department' => $staff->department ?? 'General Staff',
                ],
                'employee_code' => $staff->employee_code,
                'department' => $staff->department ?? 'General Staff',
                'designation' => $staff->designation,
                'date' => $date,
                'status' => $rec?->status ?? 'present',
                'punch_in' => $rec?->punch_in?->toIso8601String(),
                'punch_out' => $rec?->punch_out?->toIso8601String(),
                'source' => $rec?->source ?? 'manual_admin',
                'work_minutes' => $rec?->work_minutes ?? 0,
                'is_late' => $rec?->is_late ?? false,
                'is_half_day' => $rec?->is_half_day ?? false,
                'is_overridden' => $rec?->is_overridden ?? false,
                'override_reason' => $rec?->override_reason,
            ];
        });

        return response()->json([
            'date' => $date,
            'roster' => $roster,
        ]);
    }

    /**
     * Update daily attendance status for an employee.
     */
    public function updateDailyAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'status' => 'required|string|in:present,absent,half_day,on_leave,holiday,wfh',
            'punch_in' => 'nullable|date',
            'punch_out' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $adminId = $request->user()?->id ?? Auth::id();

        $rec = DailyAttendance::updateOrCreate(
            [
                'user_id' => $validated['user_id'],
                'attendance_date' => Carbon::parse($validated['date'])->toDateString(),
            ],
            [
                'status' => $validated['status'],
                'punch_in' => !empty($validated['punch_in']) ? Carbon::parse($validated['punch_in']) : null,
                'punch_out' => !empty($validated['punch_out']) ? Carbon::parse($validated['punch_out']) : null,
                'source' => 'manual_admin',
                'is_overridden' => true,
                'overridden_by' => $adminId,
                'override_reason' => $validated['notes'] ?? 'Updated by Admin in ERP',
            ]
        );

        return response()->json([
            'message' => 'Daily attendance updated successfully.',
            'record' => $rec,
        ]);
    }

    /**
     * Get active office geofences for mobile app validation.
     */
    public function geofences(): JsonResponse
    {
        return response()->json([
            'geofences' => OfficeGeofence::where('is_active', true)->get(),
        ]);
    }

    /**
     * Mobile App Punch-In.
     */
    public function punchIn(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'device_id' => 'nullable|string|max:100',
            'device_model' => 'nullable|string|max:100',
        ]);

        $today = now()->toDateString();

        $record = DailyAttendance::firstOrNew([
            'user_id' => $user->id,
            'attendance_date' => $today,
        ]);

        if ($record->punch_in) {
            return response()->json([
                'message' => 'Already punched in today at ' . $record->punch_in->format('H:i A'),
                'record' => $record,
            ], 422);
        }

        $record->punch_in = now();
        $record->punch_in_latitude = $validated['latitude'] ?? null;
        $record->punch_in_longitude = $validated['longitude'] ?? null;
        $record->device_id = $validated['device_id'] ?? null;
        $record->device_model = $validated['device_model'] ?? null;
        $record->ip_address = $request->ip();
        $record->source = 'mobile_gps';
        $record->status = 'present';
        $record->save();

        return response()->json([
            'message' => 'Punched in successfully at ' . now()->format('H:i A'),
            'record' => $record,
        ]);
    }

    /**
     * Mobile App Punch-Out.
     */
    public function punchOut(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        $today = now()->toDateString();

        $record = DailyAttendance::where('user_id', $user->id)
            ->where('attendance_date', $today)
            ->first();

        if (!$record || !$record->punch_in) {
            return response()->json([
                'message' => 'You must punch in first before punching out.',
            ], 422);
        }

        $punchOut = now();
        $record->punch_out = $punchOut;
        $record->punch_out_latitude = $validated['latitude'] ?? null;
        $record->punch_out_longitude = $validated['longitude'] ?? null;
        $record->work_minutes = max(0, $punchOut->diffInMinutes($record->punch_in));
        $record->save();

        return response()->json([
            'message' => 'Punched out successfully at ' . now()->format('H:i A'),
            'record' => $record,
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
            ->orderBy('name', 'asc')
            ->get();

        $result = $staff->map(function ($u) {
            $struct = $u->salaryStructure;
            $isConfigured = $struct !== null && (float) $struct->ctc_annual > 0;
            return [
                'id' => $struct?->id ?? $u->id,
                'user_id' => $u->id,
                'is_configured' => $isConfigured,
                'user' => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'department' => $u->department ?? 'General Staff',
                    'designation' => $u->designation,
                ],
                'ctc_annual' => (float) ($struct?->ctc_annual ?? 0),
                'city_tier' => $struct?->city_tier ?? 'non_metro',
                'gross_monthly' => (float) ($struct?->gross_monthly ?? 0),
                'basic_monthly' => (float) ($struct?->basic_monthly ?? 0),
                'hra_monthly' => (float) ($struct?->hra_monthly ?? 0),
                'has_hra' => (bool) ($struct?->has_hra ?? true),
                'special_allowance_monthly' => (float) ($struct?->special_allowance ?? 0),
                'has_special_allowance' => (bool) ($struct?->has_special_allowance ?? true),
                'conveyance_monthly' => (float) ($struct?->conveyance_allowance ?? 0),
                'has_conveyance' => (bool) ($struct?->has_conveyance ?? true),
                'has_epf' => (bool) ($struct?->has_epf ?? true),
                'epf_mode' => $struct?->epf_mode ?? 'statutory_capped',
                'epf_employee' => (float) ($struct?->pf_employee ?? 0),
                'epf_employer' => (float) ($struct?->epf_employer ?? 0),
                'has_esi' => (bool) ($struct?->has_esi ?? false),
                'esi_employee' => (float) ($struct?->esi_employee ?? 0),
                'esi_employer' => (float) ($struct?->esi_employer ?? 0),
                'has_professional_tax' => (bool) ($struct?->has_professional_tax ?? true),
                'professional_tax' => (float) ($struct?->professional_tax ?? 200),
                'pt_state' => $struct?->pt_state ?? 'Assam',
                'has_gratuity' => (bool) ($struct?->has_gratuity ?? true),
                'gratuity_monthly' => (float) ($struct?->gratuity_monthly ?? 0),
                'has_tds' => (bool) ($struct?->has_tds ?? false),
                'tds_monthly' => (float) ($struct?->tds_monthly ?? 0),
                'tax_regime' => $struct?->tax_regime ?? 'new',
                'net_monthly' => (float) ($struct?->net_monthly ?? 0),
                'total_employer_cost' => (float) ($struct?->total_employer_cost ?? 0),
                'effective_from' => $struct?->effective_from?->format('Y-m-d') ?? null,
                'bank_name' => $u->bank_name ?? null,
                'account_number' => $u->account_number ?? null,
                'ifsc_code' => $u->ifsc_code ?? null,
                'pan_number' => $u->pan_number ?? null,
                'uan_number' => $u->uan_number ?? null,
                'esic_number' => $u->esic_number ?? null,
            ];
        });

        return response()->json([
            'salary_structures' => $result,
        ]);
    }

    /**
     * Show salary structure for a specific staff member.
     */
    public function getSalaryStructure(User $user): JsonResponse
    {
        $structure = SalaryStructure::where('user_id', $user->id)->first();
        $payload = null;

        if ($structure) {
            $payload = array_merge($structure->toArray(), [
                'bank_name' => $user->bank_name,
                'account_number' => $user->account_number,
                'ifsc_code' => $user->ifsc_code,
                'pan_number' => $user->pan_number,
                'uan_number' => $user->uan_number,
                'esic_number' => $user->esic_number,
            ]);
        }

        return response()->json([
            'user' => $user->load(['customRole']),
            'salary_structure' => $payload,
        ]);
    }

    /**
     * Store or update salary structure (CTC breakdown with Indian statutory rules & toggles).
     */
    public function storeSalaryStructure(Request $request): JsonResponse
    {
        $input = $request->all();

        // Harmonize field naming aliases
        if (isset($input['special_allowance_monthly']) && !isset($input['special_allowance'])) {
            $input['special_allowance'] = $input['special_allowance_monthly'];
        }
        if (isset($input['conveyance_monthly']) && !isset($input['conveyance_allowance'])) {
            $input['conveyance_allowance'] = $input['conveyance_monthly'];
        }
        if (isset($input['epf_employee']) && !isset($input['pf_employee'])) {
            $input['pf_employee'] = $input['epf_employee'];
        }

        $validated = validator($input, [
            'user_id' => 'required|exists:users,id',
            'ctc_annual' => 'required|numeric|min:0',
            'city_tier' => 'nullable|string|in:non_metro,metro',
            'basic_monthly' => 'nullable|numeric|min:0',
            'has_hra' => 'nullable|boolean',
            'hra_monthly' => 'nullable|numeric|min:0',
            'has_special_allowance' => 'nullable|boolean',
            'special_allowance' => 'nullable|numeric|min:0',
            'has_conveyance' => 'nullable|boolean',
            'conveyance_allowance' => 'nullable|numeric|min:0',
            'has_epf' => 'nullable|boolean',
            'epf_mode' => 'nullable|string|in:statutory_capped,actual,exempt',
            'pf_employee' => 'nullable|numeric|min:0',
            'epf_employer' => 'nullable|numeric|min:0',
            'has_esi' => 'nullable|boolean',
            'esi_employee' => 'nullable|numeric|min:0',
            'esi_employer' => 'nullable|numeric|min:0',
            'has_professional_tax' => 'nullable|boolean',
            'professional_tax' => 'nullable|numeric|min:0',
            'pt_state' => 'nullable|string|max:50',
            'has_gratuity' => 'nullable|boolean',
            'gratuity_monthly' => 'nullable|numeric|min:0',
            'has_tds' => 'nullable|boolean',
            'tds_monthly' => 'nullable|numeric|min:0',
            'tax_regime' => 'nullable|string|in:new,old',
            'effective_from' => 'nullable|date',
            'bank_name' => 'nullable|string|max:100',
            'account_number' => 'nullable|string|max:50',
            'ifsc_code' => 'nullable|string|max:20',
            'pan_number' => 'nullable|string|max:20',
            'uan_number' => 'nullable|string|max:30',
            'esic_number' => 'nullable|string|max:30',
        ])->validate();

        $ctcAnnual = (float) $validated['ctc_annual'];
        $grossMonthly = $ctcAnnual / 12;

        // Extract component toggles
        $hasHra = filter_var($validated['has_hra'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasConv = filter_var($validated['has_conveyance'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasSpec = filter_var($validated['has_special_allowance'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasEpf = filter_var($validated['has_epf'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasEsi = filter_var($validated['has_esi'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $hasPt = filter_var($validated['has_professional_tax'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasGratuity = filter_var($validated['has_gratuity'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $hasTds = filter_var($validated['has_tds'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Earnings
        $basic = !empty($validated['basic_monthly']) ? (float) $validated['basic_monthly'] : round($grossMonthly * 0.50, 2);
        $hra = $hasHra ? (!empty($validated['hra_monthly']) ? (float) $validated['hra_monthly'] : round($basic * 0.40, 2)) : 0.0;
        $conveyance = $hasConv ? (!empty($validated['conveyance_allowance']) ? (float) $validated['conveyance_allowance'] : 1600.00) : 0.0;
        $special = $hasSpec ? (!empty($validated['special_allowance']) ? (float) $validated['special_allowance'] : max(0, round($grossMonthly - $basic - $hra - $conveyance, 2))) : 0.0;

        // Deductions & Statutory Contributions
        $epfMode = $validated['epf_mode'] ?? 'statutory_capped';
        if ($hasEpf && $epfMode !== 'exempt') {
            $pf = !empty($validated['pf_employee']) ? (float) $validated['pf_employee'] : ($epfMode === 'statutory_capped' ? min(1800.00, round($basic * 0.12, 2)) : round($basic * 0.12, 2));
            $epfEmployer = !empty($validated['epf_employer']) ? (float) $validated['epf_employer'] : $pf;
        } else {
            $pf = 0.0;
            $epfEmployer = 0.0;
        }

        // ESIC: 0.75% employee & 3.25% employer if gross <= 21,000
        $effectiveGross = $basic + $hra + $conveyance + $special;
        if ($hasEsi && $effectiveGross <= 21000) {
            $esiEmployee = !empty($validated['esi_employee']) ? (float) $validated['esi_employee'] : round($effectiveGross * 0.0075, 2);
            $esiEmployer = !empty($validated['esi_employer']) ? (float) $validated['esi_employer'] : round($effectiveGross * 0.0325, 2);
        } else {
            $esiEmployee = 0.0;
            $esiEmployer = 0.0;
        }

        // Professional Tax (Assam slabs by default)
        if ($hasPt) {
            if (isset($validated['professional_tax'])) {
                $pt = (float) $validated['professional_tax'];
            } else {
                if ($effectiveGross <= 10000) {
                    $pt = 0.0;
                } elseif ($effectiveGross <= 15000) {
                    $pt = 150.0;
                } elseif ($effectiveGross <= 25000) {
                    $pt = 180.0;
                } else {
                    $pt = 208.0;
                }
            }
        } else {
            $pt = 0.0;
        }

        // Gratuity: 4.81% of basic
        $gratuityMonthly = $hasGratuity ? (!empty($validated['gratuity_monthly']) ? (float) $validated['gratuity_monthly'] : round((15 / 26) * ($basic / 12), 2)) : 0.0;

        // TDS
        $tds = $hasTds ? (!empty($validated['tds_monthly']) ? (float) $validated['tds_monthly'] : 0.0) : 0.0;

        $structure = SalaryStructure::updateOrCreate(
            ['user_id' => $validated['user_id']],
            [
                'ctc_annual' => $ctcAnnual,
                'city_tier' => $validated['city_tier'] ?? 'non_metro',
                'basic_monthly' => $basic,
                'has_hra' => $hasHra,
                'hra_monthly' => $hra,
                'has_special_allowance' => $hasSpec,
                'special_allowance' => $special,
                'has_conveyance' => $hasConv,
                'conveyance_allowance' => $conveyance,
                'has_epf' => $hasEpf,
                'epf_mode' => $epfMode,
                'pf_employee' => $pf,
                'epf_employer' => $epfEmployer,
                'has_esi' => $hasEsi,
                'esi_employee' => $esiEmployee,
                'esi_employer' => $esiEmployer,
                'has_professional_tax' => $hasPt,
                'professional_tax' => $pt,
                'pt_state' => $validated['pt_state'] ?? 'Assam',
                'has_gratuity' => $hasGratuity,
                'gratuity_monthly' => $gratuityMonthly,
                'has_tds' => $hasTds,
                'tds_monthly' => $tds,
                'tax_regime' => $validated['tax_regime'] ?? 'new',
                'effective_from' => $validated['effective_from'] ?? now()->toDateString(),
            ]
        );

        // Update banking/PAN/UAN/ESIC fields on User if provided
        $userUpdate = [];
        foreach (['bank_name', 'account_number', 'ifsc_code', 'pan_number', 'uan_number', 'esic_number'] as $field) {
            if (isset($validated[$field])) {
                $userUpdate[$field] = $validated[$field];
            }
        }
        if (!empty($userUpdate)) {
            User::where('id', $validated['user_id'])->update($userUpdate);
        }

        return response()->json([
            'message' => 'Salary structure saved successfully.',
            'salary_structure' => array_merge($structure->fresh()->toArray(), [
                'bank_name' => $userUpdate['bank_name'] ?? null,
                'account_number' => $userUpdate['account_number'] ?? null,
                'ifsc_code' => $userUpdate['ifsc_code'] ?? null,
                'pan_number' => $userUpdate['pan_number'] ?? null,
                'uan_number' => $userUpdate['uan_number'] ?? null,
                'esic_number' => $userUpdate['esic_number'] ?? null,
            ]),
        ]);
    }

    /**
     * Payroll Batches Overview.
     */
    public function payrollOverview(Request $request): JsonResponse
    {
        try {
            $batches = PayrollBatch::with(['finalizer', 'payslips.user'])
                ->orderBy('year', 'desc')
                ->orderBy('month', 'desc')
                ->get();

            $formattedBatches = $batches->map(function ($b) {
                $monthStr = sprintf('%04d-%02d', $b->year, $b->month);
                $arr = $b->toArray();
                $arr['month'] = $monthStr;
                $arr['formatted_month'] = $monthStr;
                $arr['month_number'] = $b->month;
                $arr['year_number'] = $b->year;
                $arr['payslips_count'] = count($arr['payslips'] ?? []);
                return $arr;
            });

            $stats = [
                'total_batches' => $batches->count(),
                'total_disbursed' => (float) $batches->where('status', 'paid')->sum('total_net'),
                'pending_drafts' => $batches->where('status', 'draft')->count(),
            ];

            return response()->json([
                'batches' => $formattedBatches,
                'stats' => $stats,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Payroll overview error: ' . $e->getMessage());
            return response()->json([
                'batches' => [],
                'stats' => [
                    'total_batches' => 0,
                    'total_disbursed' => 0,
                    'pending_drafts' => 0,
                ],
                'error' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Calculate and preview payroll for a month before finalizing.
     */
    public function payrollCalculate(Request $request): JsonResponse
    {
        $monthInput = $request->input('month');
        if (is_string($monthInput) && str_contains($monthInput, '-')) {
            $parts = explode('-', $monthInput);
            $year = (int) $parts[0];
            $month = (int) $parts[1];
        } else {
            $month = (int) ($monthInput ?: now()->month);
            $year = (int) ($request->input('year') ?: now()->year);
        }

        $startOfMonth = Carbon::create($year, $month, 1);
        $totalDaysInMonth = $startOfMonth->daysInMonth;

        // Working days: calendar days excluding weekends and gazetted holidays
        $holidays = CompanyHoliday::whereYear('holiday_date', $year)
            ->whereMonth('holiday_date', $month)
            ->where('is_optional', false)
            ->pluck('holiday_date')
            ->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))
            ->toArray();

        $workingDays = 0;
        for ($day = 1; $day <= $totalDaysInMonth; $day++) {
            $date = Carbon::create($year, $month, $day);
            if (!$date->isWeekend() && !in_array($date->format('Y-m-d'), $holidays)) {
                $workingDays++;
            }
        }

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
        $totalLopDeductions = 0;

        foreach ($staff as $s) {
            $structure = $s->salaryStructure;
            if (!$structure) {
                $preview[] = [
                    'user_id' => $s->id,
                    'name' => $s->name,
                    'user_name' => $s->name,
                    'employee_code' => $s->employee_code,
                    'department' => $s->department ?? 'General Staff',
                    'designation' => $s->designation,
                    'has_salary_structure' => false,
                    'gross' => 0,
                    'gross_monthly' => 0,
                    'deductions' => 0,
                    'net' => 0,
                    'net_salary' => 0,
                    'lop_days' => 0,
                    'lop_deduction' => 0,
                    'working_days' => $workingDays,
                    'paid_days' => $workingDays,
                ];
                continue;
            }

            $att = $attendances->get($s->id);
            $lopDays = $att ? (float) $att->lop_days : 0;
            $paidDays = max(0, $workingDays - $lopDays);

            $hra = ($structure->has_hra ?? true) ? (float) $structure->hra_monthly : 0.0;
            $special = ($structure->has_special_allowance ?? true) ? (float) $structure->special_allowance : 0.0;
            $conveyance = ($structure->has_conveyance ?? true) ? (float) $structure->conveyance_allowance : 0.0;
            $grossMonthly = round((float) $structure->basic_monthly + $hra + $special + $conveyance, 2);
            
            // Daily wage calculation for Loss of Pay (LOP)
            $dailyWage = $totalDaysInMonth > 0 ? $grossMonthly / $totalDaysInMonth : 0;
            $lopDeduction = round($dailyWage * $lopDays, 2);

            $pf = ($structure->has_epf ?? true) ? (float) $structure->pf_employee : 0.0;
            $esi = ($structure->has_esi ?? false) ? (float) ($structure->esi_employee ?? 0) : 0.0;
            $pt = ($structure->has_professional_tax ?? true) ? (float) $structure->professional_tax : 0.0;
            $tds = ($structure->has_tds ?? false) ? (float) $structure->tds_monthly : 0.0;

            $statutoryDeductions = round($pf + $esi + $pt + $tds, 2);
            $userTotalDeductions = round($statutoryDeductions + $lopDeduction, 2);
            $netPay = max(0, round($grossMonthly - $userTotalDeductions, 2));

            $totalGross += $grossMonthly;
            $totalLopDeductions += $lopDeduction;
            $totalDeductions += $userTotalDeductions;
            $totalNet += $netPay;

            $preview[] = [
                'user_id' => $s->id,
                'name' => $s->name,
                'user_name' => $s->name,
                'employee_code' => $s->employee_code,
                'department' => $s->department ?? 'General Staff',
                'designation' => $s->designation,
                'has_salary_structure' => true,
                'basic' => (float) $structure->basic_monthly,
                'basic_monthly' => (float) $structure->basic_monthly,
                'hra' => $hra,
                'hra_monthly' => $hra,
                'allowances' => round($special + $conveyance, 2),
                'special_allowance' => $special,
                'conveyance' => $conveyance,
                'gross' => $grossMonthly,
                'gross_monthly' => $grossMonthly,
                'pf' => $pf,
                'epf_employee' => $pf,
                'esi' => $esi,
                'esi_employee' => $esi,
                'pt' => $pt,
                'professional_tax' => $pt,
                'tds' => $tds,
                'lop_days' => $lopDays,
                'lop_deduction' => $lopDeduction,
                'total_deductions' => $userTotalDeductions,
                'net' => $netPay,
                'net_salary' => $netPay,
                'total_days' => $totalDaysInMonth,
                'total_days_in_month' => $totalDaysInMonth,
                'working_days' => $workingDays,
                'paid_days' => $paidDays,
            ];
        }

        $items = array_values(array_filter($preview, fn($r) => $r['has_salary_structure']));

        return response()->json([
            'month' => sprintf('%04d-%02d', $year, $month),
            'month_number' => $month,
            'year' => $year,
            'working_days' => $workingDays,
            'total_days_in_month' => $totalDaysInMonth,
            'total_gross' => round($totalGross, 2),
            'total_lop_deductions' => round($totalLopDeductions, 2),
            'total_deductions' => round($totalDeductions, 2),
            'total_net' => round($totalNet, 2),
            'staff_count' => count($items),
            'records' => $preview,
            'items' => $items,
        ]);
    }

    /**
     * Generate Monthly Payroll Batch & Individual Payslips.
     */
    public function payrollGenerate(Request $request): JsonResponse
    {
        $monthInput = $request->input('month');
        if (is_string($monthInput) && str_contains($monthInput, '-')) {
            $parts = explode('-', $monthInput);
            $year = (int) $parts[0];
            $month = (int) $parts[1];
        } else {
            $month = (int) ($monthInput ?: now()->month);
            $year = (int) ($request->input('year') ?: now()->year);
        }

        if ($month < 1 || $month > 12 || $year < 2020 || $year > 2035) {
            return response()->json(['message' => 'Invalid month or year.'], 422);
        }

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
                        'esi_deduction' => $record['esi'] ?? 0.00,
                        'pt_deduction' => $record['pt'],
                        'tds_deduction' => $record['tds'],
                        'lop_deduction' => $record['lop_deduction'],
                        'total_deductions' => $record['total_deductions'],
                        'net_pay' => $record['net'],
                        'total_days' => $calc['working_days'] ?? $record['total_days'],
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
