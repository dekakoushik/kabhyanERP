<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Estimates & Quotations
            ['module' => 'estimates', 'action' => 'view', 'slug' => 'estimates.view', 'name' => 'View Estimates', 'description' => 'Browse and review commercial quotations and scope drafts.'],
            ['module' => 'estimates', 'action' => 'create', 'slug' => 'estimates.create', 'name' => 'Create Estimates', 'description' => 'Author new commercial proposals and pricing scope.'],
            ['module' => 'estimates', 'action' => 'edit', 'slug' => 'estimates.edit', 'name' => 'Edit Estimates', 'description' => 'Revise and modify quotation items and terms.'],
            ['module' => 'estimates', 'action' => 'delete', 'slug' => 'estimates.delete', 'name' => 'Delete Estimates', 'description' => 'Discard unaccepted or archived quotations.'],
            ['module' => 'estimates', 'action' => 'convert_to_proforma', 'slug' => 'estimates.convert_to_proforma', 'name' => 'Convert to Proforma', 'description' => 'Convert accepted quotation into proforma invoice.'],
            ['module' => 'estimates', 'action' => 'export_pdf', 'slug' => 'estimates.export_pdf', 'name' => 'Download Estimate PDF', 'description' => 'Generate and download official PDF document.'],

            // Proforma Invoices
            ['module' => 'proforma', 'action' => 'view', 'slug' => 'proforma.view', 'name' => 'View Proforma Invoices', 'description' => 'Inspect advance billing and proforma documents.'],
            ['module' => 'proforma', 'action' => 'create', 'slug' => 'proforma.create', 'name' => 'Create Proforma Invoices', 'description' => 'Issue progressive proforma invoices to clients.'],
            ['module' => 'proforma', 'action' => 'edit', 'slug' => 'proforma.edit', 'name' => 'Edit Proforma Invoices', 'description' => 'Update proforma line items, rates, and banking terms.'],
            ['module' => 'proforma', 'action' => 'delete', 'slug' => 'proforma.delete', 'name' => 'Delete Proforma Invoices', 'description' => 'Remove draft or voided proforma invoices.'],
            ['module' => 'proforma', 'action' => 'convert_to_invoice', 'slug' => 'proforma.convert_to_invoice', 'name' => 'Convert to Tax Invoice', 'description' => 'Generate milestone GST tax invoice from proforma.'],
            ['module' => 'proforma', 'action' => 'export_pdf', 'slug' => 'proforma.export_pdf', 'name' => 'Download Proforma PDF', 'description' => 'Download official proforma invoice PDF.'],

            // Tax Invoices
            ['module' => 'invoices', 'action' => 'view', 'slug' => 'invoices.view', 'name' => 'View Tax Invoices', 'description' => 'View GST compliant tax invoices and billing ledger.'],
            ['module' => 'invoices', 'action' => 'create', 'slug' => 'invoices.create', 'name' => 'Create Tax Invoices', 'description' => 'Issue official tax invoices for IT and services deliverables.'],
            ['module' => 'invoices', 'action' => 'edit', 'slug' => 'invoices.edit', 'name' => 'Edit Tax Invoices', 'description' => 'Modify invoice particulars prior to fiscal submission.'],
            ['module' => 'invoices', 'action' => 'delete', 'slug' => 'invoices.delete', 'name' => 'Delete Tax Invoices', 'description' => 'Void or delete cancelled tax invoices.'],
            ['module' => 'invoices', 'action' => 'record_payment', 'slug' => 'invoices.record_payment', 'name' => 'Record Payments', 'description' => 'Log customer payment receipts and reconcile dues.'],
            ['module' => 'invoices', 'action' => 'export_pdf', 'slug' => 'invoices.export_pdf', 'name' => 'Download Tax Invoice PDF', 'description' => 'Generate official tax invoice with digital seal.'],

            // Accounts & Income
            ['module' => 'accounts', 'action' => 'view', 'slug' => 'accounts.view', 'name' => 'View Financial Ledger', 'description' => 'Access corporate revenue, collections, and cashflow reports.'],
            ['module' => 'accounts', 'action' => 'export_reports', 'slug' => 'accounts.export_reports', 'name' => 'Export Financial Reports', 'description' => 'Download corporate balance and P&L statements.'],

            // Expenses
            ['module' => 'expenses', 'action' => 'view', 'slug' => 'expenses.view', 'name' => 'View Expenses', 'description' => 'Browse corporate expenditures and receipts.'],
            ['module' => 'expenses', 'action' => 'create', 'slug' => 'expenses.create', 'name' => 'Record Expense', 'description' => 'File organizational expense entries and receipts.'],
            ['module' => 'expenses', 'action' => 'edit', 'slug' => 'expenses.edit', 'name' => 'Edit Expenses', 'description' => 'Adjust amounts, payment methods, and category tags.'],
            ['module' => 'expenses', 'action' => 'delete', 'slug' => 'expenses.delete', 'name' => 'Delete Expenses', 'description' => 'Remove incorrect or voided expense entries.'],
            ['module' => 'expenses', 'action' => 'manage_categories', 'slug' => 'expenses.manage_categories', 'name' => 'Manage Expense Categories', 'description' => 'Create and configure expense ledger categories.'],

            // Clients
            ['module' => 'clients', 'action' => 'view', 'slug' => 'clients.view', 'name' => 'View Client Directory', 'description' => 'Browse client companies, GSTINs, and contacts.'],
            ['module' => 'clients', 'action' => 'create', 'slug' => 'clients.create', 'name' => 'Create Clients', 'description' => 'Register new corporate client profiles.'],
            ['module' => 'clients', 'action' => 'edit', 'slug' => 'clients.edit', 'name' => 'Edit Clients', 'description' => 'Update client billing coordinates, GSTIN, and contacts.'],
            ['module' => 'clients', 'action' => 'delete', 'slug' => 'clients.delete', 'name' => 'Delete Clients', 'description' => 'Archive or delete client accounts.'],
            ['module' => 'clients', 'action' => 'manage_portal_access', 'slug' => 'clients.manage_portal_access', 'name' => 'Manage Client Portal', 'description' => 'Send portal invites and manage client login credentials.'],

            // Projects Portfolio
            ['module' => 'projects', 'action' => 'view', 'slug' => 'projects.view', 'name' => 'View Projects', 'description' => 'Inspect project milestones, scope, and progress.'],
            ['module' => 'projects', 'action' => 'create', 'slug' => 'projects.create', 'name' => 'Create Projects', 'description' => 'Initiate new enterprise projects.'],
            ['module' => 'projects', 'action' => 'edit', 'slug' => 'projects.edit', 'name' => 'Edit Projects', 'description' => 'Update project timelines, status, and budget allocations.'],
            ['module' => 'projects', 'action' => 'delete', 'slug' => 'projects.delete', 'name' => 'Delete Projects', 'description' => 'Archive or remove project records.'],
            ['module' => 'projects', 'action' => 'manage_members', 'slug' => 'projects.manage_members', 'name' => 'Manage Project Team', 'description' => 'Assign and remove engineers and managers.'],

            // Tasks & Kanban
            ['module' => 'tasks', 'action' => 'view', 'slug' => 'tasks.view', 'name' => 'View Tasks', 'description' => 'View tasks and Kanban board workflows.'],
            ['module' => 'tasks', 'action' => 'create', 'slug' => 'tasks.create', 'name' => 'Create Tasks', 'description' => 'Add new deliverable tasks into project sprints.'],
            ['module' => 'tasks', 'action' => 'edit', 'slug' => 'tasks.edit', 'name' => 'Edit Tasks', 'description' => 'Modify task descriptions, deadlines, and estimated hours.'],
            ['module' => 'tasks', 'action' => 'delete', 'slug' => 'tasks.delete', 'name' => 'Delete Tasks', 'description' => 'Discard obsolete tasks.'],
            ['module' => 'tasks', 'action' => 'update_status', 'slug' => 'tasks.update_status', 'name' => 'Update Task Status', 'description' => 'Transition tasks across Kanban lanes.'],

            // Support Tickets
            ['module' => 'tickets', 'action' => 'view', 'slug' => 'tickets.view', 'name' => 'View Support Tickets', 'description' => 'Review customer support and change requests.'],
            ['module' => 'tickets', 'action' => 'create', 'slug' => 'tickets.create', 'name' => 'Create Tickets', 'description' => 'File service desk issues on behalf of clients or internal team.'],
            ['module' => 'tickets', 'action' => 'reply', 'slug' => 'tickets.reply', 'name' => 'Reply to Tickets', 'description' => 'Post answers and resolve customer queries.'],
            ['module' => 'tickets', 'action' => 'assign', 'slug' => 'tickets.assign', 'name' => 'Assign Tickets', 'description' => 'Delegate tickets to technical leads and specialists.'],
            ['module' => 'tickets', 'action' => 'change_status', 'slug' => 'tickets.change_status', 'name' => 'Change Ticket Status', 'description' => 'Resolve, escalate, or close support tickets.'],

            // Team & Staff
            ['module' => 'staff', 'action' => 'view', 'slug' => 'staff.view', 'name' => 'View Staff Directory', 'description' => 'Access employee records, contact info, and departments.'],
            ['module' => 'staff', 'action' => 'create', 'slug' => 'staff.create', 'name' => 'Onboard Staff', 'description' => 'Register new staff members and configure login credentials.'],
            ['module' => 'staff', 'action' => 'edit', 'slug' => 'staff.edit', 'name' => 'Edit Staff Records', 'description' => 'Update employee designation, department, and permissions.'],
            ['module' => 'staff', 'action' => 'suspend', 'slug' => 'staff.suspend', 'name' => 'Suspend Staff Account', 'description' => 'Temporarily freeze or activate staff access.'],
            ['module' => 'staff', 'action' => 'delete', 'slug' => 'staff.delete', 'name' => 'Delete Staff Account', 'description' => 'Terminate and remove staff profiles.'],

            // Roles & Permissions
            ['module' => 'roles', 'action' => 'view', 'slug' => 'roles.view', 'name' => 'View Roles & Permissions', 'description' => 'Inspect custom roles and system access policies.'],
            ['module' => 'roles', 'action' => 'manage', 'slug' => 'roles.manage', 'name' => 'Manage Roles & Permissions', 'description' => 'Create custom roles and alter modular permission matrices.'],

            // System Settings
            ['module' => 'settings', 'action' => 'view', 'slug' => 'settings.view', 'name' => 'View Settings', 'description' => 'Review corporate configuration and server vitals.'],
            ['module' => 'settings', 'action' => 'manage_company', 'slug' => 'settings.manage_company', 'name' => 'Manage Company Profile', 'description' => 'Update legal entity details, CIN, and brand logos.'],
            ['module' => 'settings', 'action' => 'manage_taxation', 'slug' => 'settings.manage_taxation', 'name' => 'Manage GST & Numbering', 'description' => 'Configure document prefixes, bank coordinates, and GST compliance.'],
            ['module' => 'settings', 'action' => 'flush_cache', 'slug' => 'settings.flush_cache', 'name' => 'Flush System Cache', 'description' => 'Clear application cache and reload system state.'],
        ];

        foreach ($permissions as $p) {
            Permission::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // Standard System Roles
        $systemRoles = [
            [
                'name' => 'Super Administrator',
                'slug' => 'superadmin',
                'description' => 'Unrestricted root authority across all corporate operations, financials, and configurations.',
                'color' => 'purple',
                'is_system' => true,
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Executive access to daily operations, invoicing, client relations, and team management.',
                'color' => 'blue',
                'is_system' => true,
            ],
            [
                'name' => 'Project Manager',
                'slug' => 'manager',
                'description' => 'Supervises deliverable execution, client communications, sprint tasks, and billing scope.',
                'color' => 'indigo',
                'is_system' => true,
            ],
            [
                'name' => 'Human Resources (HR)',
                'slug' => 'hr',
                'description' => 'Oversees staff onboarding, departmental records, operational expenses, and team directory.',
                'color' => 'emerald',
                'is_system' => true,
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
                'description' => 'Individual contributor access for assigned tasks, projects, and ticketing collaboration.',
                'color' => 'slate',
                'is_system' => true,
            ],
        ];

        foreach ($systemRoles as $sr) {
            Role::updateOrCreate(['slug' => $sr['slug']], $sr);
        }

        // Pre-configured Custom Role Templates
        $customTemplates = [
            [
                'name' => 'Billing & Finance Specialist',
                'slug' => 'billing-specialist',
                'description' => 'Manages client estimates, proforma invoices, GST tax invoices, and payment receipts.',
                'color' => 'amber',
                'is_system' => false,
                'permissions' => [
                    'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.convert_to_proforma', 'estimates.export_pdf',
                    'proforma.view', 'proforma.create', 'proforma.edit', 'proforma.convert_to_invoice', 'proforma.export_pdf',
                    'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.record_payment', 'invoices.export_pdf',
                    'accounts.view', 'accounts.export_reports',
                    'expenses.view', 'expenses.create',
                    'clients.view',
                ],
            ],
            [
                'name' => 'Technical Engineering Lead',
                'slug' => 'engineering-lead',
                'description' => 'Leads software engineering teams, manages project sprint tasks, and oversees support tickets.',
                'color' => 'cyan',
                'is_system' => false,
                'permissions' => [
                    'projects.view', 'projects.create', 'projects.edit', 'projects.manage_members',
                    'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.update_status',
                    'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.assign', 'tickets.change_status',
                    'staff.view',
                    'clients.view',
                ],
            ],
            [
                'name' => 'Client Relations Lead',
                'slug' => 'client-relations-lead',
                'description' => 'Focuses on client satisfaction, client portal onboarding, estimates, and customer support.',
                'color' => 'teal',
                'is_system' => false,
                'permissions' => [
                    'clients.view', 'clients.create', 'clients.edit', 'clients.manage_portal_access',
                    'estimates.view', 'estimates.create', 'estimates.export_pdf',
                    'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.change_status',
                    'projects.view',
                ],
            ],
            [
                'name' => 'Internal Compliance Auditor',
                'slug' => 'compliance-auditor',
                'description' => 'Read-only financial and operational auditing authority across records and statements.',
                'color' => 'rose',
                'is_system' => false,
                'permissions' => [
                    'estimates.view', 'estimates.export_pdf',
                    'proforma.view', 'proforma.export_pdf',
                    'invoices.view', 'invoices.export_pdf',
                    'accounts.view', 'accounts.export_reports',
                    'expenses.view',
                    'clients.view',
                    'projects.view',
                    'staff.view',
                    'settings.view',
                ],
            ],
        ];

        foreach ($customTemplates as $ct) {
            $perms = $ct['permissions'];
            unset($ct['permissions']);
            $role = Role::updateOrCreate(['slug' => $ct['slug']], $ct);
            $role->syncPermissions($perms);
        }

        // Sync system role permissions
        $allPermIds = Permission::pluck('id')->toArray();

        // SuperAdmin gets everything
        $superAdminRole = Role::where('slug', 'superadmin')->first();
        $superAdminRole?->permissions()->sync($allPermIds);

        // Admin gets everything except role deletion
        $adminRole = Role::where('slug', 'admin')->first();
        $adminRole?->permissions()->sync($allPermIds);

        // Manager permissions
        $managerPerms = Permission::whereIn('slug', [
            'estimates.view', 'estimates.create', 'estimates.edit', 'estimates.convert_to_proforma', 'estimates.export_pdf',
            'proforma.view', 'proforma.create', 'proforma.edit', 'proforma.convert_to_invoice', 'proforma.export_pdf',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.record_payment', 'invoices.export_pdf',
            'expenses.view', 'expenses.create', 'expenses.edit',
            'clients.view', 'clients.create', 'clients.edit',
            'projects.view', 'projects.create', 'projects.edit', 'projects.manage_members',
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.update_status',
            'tickets.view', 'tickets.create', 'tickets.reply', 'tickets.assign', 'tickets.change_status',
            'staff.view',
        ])->pluck('id')->toArray();
        $managerRole = Role::where('slug', 'manager')->first();
        $managerRole?->permissions()->sync($managerPerms);

        // HR permissions
        $hrPerms = Permission::whereIn('slug', [
            'staff.view', 'staff.create', 'staff.edit', 'staff.suspend',
            'expenses.view', 'expenses.create',
            'estimates.view', 'estimates.create',
            'projects.view', 'tasks.view', 'tickets.view', 'tickets.reply',
        ])->pluck('id')->toArray();
        $hrRole = Role::where('slug', 'hr')->first();
        $hrRole?->permissions()->sync($hrPerms);

        // Employee permissions
        $employeePerms = Permission::whereIn('slug', [
            'projects.view',
            'tasks.view', 'tasks.update_status',
            'tickets.view', 'tickets.create', 'tickets.reply',
        ])->pluck('id')->toArray();
        $employeeRole = Role::where('slug', 'employee')->first();
        $employeeRole?->permissions()->sync($employeePerms);

        // Link existing staff users to role_id and assign employee_code if missing
        $users = User::whereNull('role_id')->where('role', '!=', 'client')->get();
        foreach ($users as $index => $user) {
            $matchingRole = Role::where('slug', $user->role)->first();
            if ($matchingRole) {
                $user->role_id = $matchingRole->id;
            }
            if (empty($user->employee_code)) {
                $user->employee_code = 'EMP-' . str_pad((string) ($user->id), 3, '0', STR_PAD_LEFT);
            }
            if (empty($user->date_of_joining)) {
                $user->date_of_joining = $user->created_at?->toDateString() ?? now()->toDateString();
            }
            $user->save();
        }
    }
}
