<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientPortalController;
use App\Http\Controllers\Api\EstimateController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FinancialReportController;
use App\Http\Controllers\Api\HrmsController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PdfController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProformaInvoiceController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use App\Http\Middleware\EnsureAdminOrSuperAdmin;
use App\Http\Middleware\EnsureStaffUser;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - V1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public Authentication with Rate Limiting (6 attempts per minute per IP)
    Route::middleware('throttle:6,1')->group(function () {
        Route::post('/auth/login', [AuthController::class, 'login']);
        Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    });

    Route::get('/auth/verify-invitation', [AuthController::class, 'verifyInvitation']);
    Route::post('/auth/activate-account', [AuthController::class, 'activateAccount']);

    // Protected Routes (Requires valid Sanctum Bearer Token)
    Route::middleware('auth:sanctum')->group(function () {

        // Session & Profile
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // In-App Notification Centre (Accessible to all authenticated users)
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

        // Client Portal Endpoints (Dedicated portal for authenticated client users)
        Route::prefix('portal')->group(function () {
            Route::get('dashboard', [ClientPortalController::class, 'dashboard']);
            Route::get('projects', [ClientPortalController::class, 'projects']);
            Route::get('projects/{project}', [ClientPortalController::class, 'showProject']);
            Route::get('tickets', [ClientPortalController::class, 'tickets']);
            Route::post('tickets', [ClientPortalController::class, 'createTicket']);
            Route::get('tickets/{ticket}', [ClientPortalController::class, 'showTicket']);
            Route::post('tickets/{ticket}/reply', [ClientPortalController::class, 'replyTicket']);
        });

        // ====================================================================
        // Internal ERP Modules (Guarded: Internal Staff Only, Clients Blocked)
        // ====================================================================
        Route::middleware(EnsureStaffUser::class)->group(function () {

            // Read-only user directory for task assignments & filters
            Route::get('users', [UserController::class, 'index']);
            Route::get('users/next-code', [UserController::class, 'nextEmployeeCode']);
            Route::get('users/departments', [UserController::class, 'departments']);
            Route::get('users/{user}', [UserController::class, 'show']);

            // Staff Account & Custom Roles Management
            Route::middleware(EnsureAdminOrSuperAdmin::class)->group(function () {
                Route::post('users', [UserController::class, 'store']);
                Route::put('users/{user}', [UserController::class, 'update']);
                Route::patch('users/{user}/status', [UserController::class, 'updateStatus']);
                Route::delete('users/{user}', [UserController::class, 'destroy']);

                // Custom Roles & Permissions Management
                Route::apiResource('roles', RoleController::class);
                Route::get('permissions', [PermissionController::class, 'index']);
            });

            // Project Management Module
            Route::apiResource('projects', ProjectController::class);

            // Task Management Module
            Route::apiResource('tasks', TaskController::class);
            Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);

            // Estimate Generation Module
            Route::get('estimates/{id}/pdf', [PdfController::class, 'downloadEstimate']);
            Route::apiResource('estimates', EstimateController::class);
            Route::patch('estimates/{estimate}/status', [EstimateController::class, 'updateStatus']);

            // Proforma Invoice Generation & Conversion
            Route::get('proforma-invoices/{id}/pdf', [PdfController::class, 'downloadProforma']);
            Route::post('estimates/{estimate}/convert-to-proforma', [ProformaInvoiceController::class, 'convertFromEstimate']);
            Route::apiResource('proforma-invoices', ProformaInvoiceController::class);
            Route::patch('proforma-invoices/{proformaInvoice}/status', [ProformaInvoiceController::class, 'updateStatus']);

            // Tax Invoice Module & Flow (From Proforma Invoice)
            Route::get('invoices/{id}/pdf', [PdfController::class, 'downloadInvoice']);
            Route::post('proforma-invoices/{proformaInvoice}/convert-to-invoice', [InvoiceController::class, 'convertFromProforma']);
            Route::apiResource('invoices', InvoiceController::class);
            Route::patch('invoices/{invoice}/status', [InvoiceController::class, 'updateStatus']);
            Route::post('invoices/{invoice}/payments', [InvoiceController::class, 'recordPayment']);

            // Expense Management Module
            Route::get('expenses/categories', [ExpenseController::class, 'categories']);
            Route::post('expenses/categories', [ExpenseController::class, 'storeCategory']);
            Route::put('expenses/categories/{category}', [ExpenseController::class, 'updateCategory']);
            Route::delete('expenses/categories/{category}', [ExpenseController::class, 'destroyCategory']);
            Route::apiResource('expenses', ExpenseController::class);

            // Client Management Module (ERP Admin / Staff)
            Route::apiResource('clients', ClientController::class);

            // Support & Change Request Tickets (ERP Admin / Staff)
            Route::apiResource('tickets', TicketController::class);
            Route::post('tickets/{ticket}/reply', [TicketController::class, 'reply']);

            // HRMS & Payroll - Staff Access
            Route::prefix('hrms')->group(function () {
                Route::get('dashboard', [HrmsController::class, 'dashboard']);
                Route::get('leaves', [HrmsController::class, 'leaves']);
                Route::get('leave-types', [HrmsController::class, 'leaveTypes']);
                Route::post('leaves', [HrmsController::class, 'applyLeave']);
                Route::get('holidays', [HrmsController::class, 'holidays']);
                Route::get('my-payslips', [HrmsController::class, 'myPayslips']);
                Route::get('payslips/{id}', [HrmsController::class, 'payslipShow']);

                // HR / Admin Management Operations
                Route::middleware(EnsureAdminOrSuperAdmin::class)->group(function () {
                    Route::patch('leaves/{leaveRequest}/status', [HrmsController::class, 'updateLeaveStatus']);
                    Route::post('holidays', [HrmsController::class, 'storeHoliday']);
                    Route::post('holidays/sync', [HrmsController::class, 'syncHolidays']);
                    Route::delete('holidays/{holiday}', [HrmsController::class, 'destroyHoliday']);
                    Route::get('attendance', [HrmsController::class, 'monthlyAttendance']);
                    Route::patch('attendance/{user}', [HrmsController::class, 'updateMonthlyAttendance']);
                    Route::get('salary-structures', [HrmsController::class, 'salaryStructures']);
                    Route::get('salary-structures/{user}', [HrmsController::class, 'getSalaryStructure']);
                    Route::post('salary-structures', [HrmsController::class, 'storeSalaryStructure']);
                    Route::get('payroll/overview', [HrmsController::class, 'payrollOverview']);
                    Route::get('payroll/calculate', [HrmsController::class, 'payrollCalculate']);
                    Route::post('payroll/generate', [HrmsController::class, 'payrollGenerate']);
                    Route::post('payroll/batches/{batch}/finalize', [HrmsController::class, 'payrollFinalize']);
                    Route::post('payroll/batches/{batch}/disburse', [HrmsController::class, 'payrollDisburse']);
                });
            });

            // System Settings - Read Access (General company metadata, next invoice numbers)
            Route::get('settings', [SettingController::class, 'index']);
            Route::get('settings/next-document-numbers', [SettingController::class, 'nextDocumentNumbers']);

            // ================================================================
            // Administrative Only (Admin & SuperAdmin Privileges Required)
            // ================================================================
            Route::middleware(EnsureAdminOrSuperAdmin::class)->group(function () {
                // Financial Reports & Income vs Expense Analytics
                Route::get('financial-reports/income-vs-expense', [FinancialReportController::class, 'incomeVsExpense']);

                // Client Invitations
                Route::post('clients/{client}/send-invite', [ClientController::class, 'sendInvite']);

                // System Settings & Infrastructure Mutations
                Route::post('settings', [SettingController::class, 'update']);
                Route::post('settings/brand-assets', [SettingController::class, 'uploadBrandAsset']);
                Route::delete('settings/brand-assets/{type}', [SettingController::class, 'deleteBrandAsset']);
                Route::post('settings/flush-cache', [SettingController::class, 'flushCache']);
                Route::post('settings/migrate-database', [SettingController::class, 'migrateDatabase']);
                Route::post('settings/test-email', [SettingController::class, 'testEmail']);
            });
        });
    });
});
