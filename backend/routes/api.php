<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientPortalController;
use App\Http\Controllers\Api\EstimateController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FinancialReportController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProformaInvoiceController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\UserController;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - V1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // Public Authentication
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    // Protected Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        // Users endpoint (accessible to all authenticated staff for assignments, with write protected to admins)
        Route::get('users', [UserController::class, 'index']);
        Route::get('users/{user}', [UserController::class, 'show']);

        // SuperAdmin / Admin Specific User Actions
        Route::middleware(EnsureSuperAdmin::class)->group(function () {
            Route::post('users', [UserController::class, 'store']);
            Route::put('users/{user}', [UserController::class, 'update']);
            Route::patch('users/{user}/status', [UserController::class, 'updateStatus']);
            Route::delete('users/{user}', [UserController::class, 'destroy']);
        });

        // Project Management Module
        Route::apiResource('projects', ProjectController::class);

        // Task Management Module
        Route::apiResource('tasks', TaskController::class);
        Route::patch('tasks/{task}/status', [TaskController::class, 'updateStatus']);

        // Estimate Generation Module
        Route::apiResource('estimates', EstimateController::class);
        Route::patch('estimates/{estimate}/status', [EstimateController::class, 'updateStatus']);

        // Proforma Invoice Generation & Conversion
        Route::post('estimates/{estimate}/convert-to-proforma', [ProformaInvoiceController::class, 'convertFromEstimate']);
        Route::apiResource('proforma-invoices', ProformaInvoiceController::class);
        Route::patch('proforma-invoices/{proformaInvoice}/status', [ProformaInvoiceController::class, 'updateStatus']);

        // Tax Invoice Module & Flow (From Proforma Invoice)
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

        // Financial Reports & Income vs Expense Analytics
        Route::get('financial-reports/income-vs-expense', [FinancialReportController::class, 'incomeVsExpense']);

        // Client Management Module (ERP Admin / Staff)
        Route::apiResource('clients', ClientController::class);

        // Support & Change Request Tickets (ERP Admin / Staff)
        Route::apiResource('tickets', TicketController::class);
        Route::post('tickets/{ticket}/reply', [TicketController::class, 'reply']);

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

        // System Settings & Infrastructure (SuperAdmin / Admin)
        Route::get('settings', [SettingController::class, 'index']);
        Route::post('settings', [SettingController::class, 'update']);
        Route::post('settings/brand-assets', [SettingController::class, 'uploadBrandAsset']);
        Route::delete('settings/brand-assets/{type}', [SettingController::class, 'deleteBrandAsset']);
        Route::post('settings/flush-cache', [SettingController::class, 'flushCache']);
        Route::post('settings/test-email', [SettingController::class, 'testEmail']);

        // In-App Notification Centre
        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);
    });
});
