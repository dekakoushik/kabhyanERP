<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    /**
     * List all system permissions, grouped by domain module.
     */
    public function index(Request $request): JsonResponse
    {
        $permissions = Permission::orderBy('module')->orderBy('action')->get();

        $grouped = $permissions->groupBy('module');

        $moduleLabels = [
            'estimates' => 'Estimates & Quotations',
            'proforma' => 'Proforma Invoices',
            'invoices' => 'Tax Invoices & Billing',
            'accounts' => 'Financial Ledger & Reports',
            'expenses' => 'Expense Register',
            'clients' => 'Client Directory & Portal',
            'projects' => 'Projects Portfolio',
            'tasks' => 'Tasks & Kanban',
            'tickets' => 'Customer Support Tickets',
            'staff' => 'Team & Staff Operations',
            'roles' => 'Roles & Permissions',
            'settings' => 'System Settings & Infrastructure',
        ];

        $modules = [];
        foreach ($grouped as $mod => $items) {
            $modules[] = [
                'module' => $mod,
                'label' => $moduleLabels[$mod] ?? ucfirst($mod),
                'permissions' => $items,
            ];
        }

        return response()->json([
            'total_permissions' => $permissions->count(),
            'modules' => $modules,
            'permissions' => $permissions,
        ]);
    }
}
