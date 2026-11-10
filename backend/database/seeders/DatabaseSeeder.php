<?php

namespace Database\Seeders;

use App\Models\Estimate;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. SuperAdmin User
        $superadmin = User::updateOrCreate(
            ['email' => 'superadmin@kabhyan.com'],
            [
                'name' => 'Kabhyan Super Admin',
                'phone' => '+91 9876543210',
                'role' => 'superadmin',
                'department' => 'Executive Office',
                'designation' => 'Chief Technology Officer',
                'status' => 'active',
                'password' => Hash::make('Kabhyan@2026'),
                'email_verified_at' => now(),
            ]
        );

        // 2. Admin User
        $admin = User::updateOrCreate(
            ['email' => 'admin@kabhyan.com'],
            [
                'name' => 'Admin Manager',
                'phone' => '+91 9876543211',
                'role' => 'admin',
                'department' => 'Operations',
                'designation' => 'Operations Director',
                'status' => 'active',
                'password' => Hash::make('Kabhyan@2026'),
                'email_verified_at' => now(),
            ]
        );

        // 3. HR User
        $hr = User::updateOrCreate(
            ['email' => 'hr@kabhyan.com'],
            [
                'name' => 'Priya Sharma',
                'phone' => '+91 9876543212',
                'role' => 'hr',
                'department' => 'Human Resources',
                'designation' => 'Lead HR Partner',
                'status' => 'active',
                'password' => Hash::make('Kabhyan@2026'),
                'email_verified_at' => now(),
            ]
        );

        // 4. Project Manager
        $manager = User::updateOrCreate(
            ['email' => 'manager@kabhyan.com'],
            [
                'name' => 'Rohit Verma',
                'phone' => '+91 9876543213',
                'role' => 'manager',
                'department' => 'Engineering',
                'designation' => 'Senior Delivery Manager',
                'status' => 'active',
                'password' => Hash::make('Kabhyan@2026'),
                'email_verified_at' => now(),
            ]
        );

        // 5. Software Engineer
        $developer = User::updateOrCreate(
            ['email' => 'dev@kabhyan.com'],
            [
                'name' => 'Aarav Patel',
                'phone' => '+91 9876543214',
                'role' => 'employee',
                'department' => 'Engineering',
                'designation' => 'Full Stack Developer',
                'status' => 'active',
                'password' => Hash::make('Kabhyan@2026'),
                'email_verified_at' => now(),
            ]
        );

        // 6. Projects Seeding
        $p1 = Project::updateOrCreate(
            ['code' => 'KAB-ERP-V1'],
            [
                'name' => 'Kabhyan Enterprise ERP Platform',
                'description' => 'Comprehensive multi-tenant ERP platform supporting Auth, Projects, Tasks, HR, and Billing with Laravel and Next.js.',
                'client_name' => 'Internal Corporate Systems',
                'manager_id' => $manager->id,
                'status' => 'in_progress',
                'priority' => 'urgent',
                'budget' => 75000.00,
                'start_date' => now()->subDays(10),
                'deadline' => now()->addDays(45),
                'progress_percentage' => 40,
            ]
        );
        $p1->members()->sync([$developer->id, $manager->id, $superadmin->id]);

        $p2 = Project::updateOrCreate(
            ['code' => 'KAB-CLOUD-MIG'],
            [
                'name' => 'Cloud Infrastructure & High Availability Redis',
                'description' => 'Migration of caching, job queues, and load balancers to dedicated cloud clusters.',
                'client_name' => 'FinTech Global Client',
                'manager_id' => $manager->id,
                'status' => 'planning',
                'priority' => 'high',
                'budget' => 45000.00,
                'start_date' => now()->addDays(5),
                'deadline' => now()->addDays(60),
                'progress_percentage' => 10,
            ]
        );
        $p2->members()->sync([$developer->id, $superadmin->id]);

        $p3 = Project::updateOrCreate(
            ['code' => 'KAB-AI-DOC'],
            [
                'name' => 'AI Automated Documentation Engine',
                'description' => 'Automated parsing of codebases to generate live architectural diagrams and changelogs in .agent folder.',
                'client_name' => 'Kabhyan R&D Labs',
                'manager_id' => $superadmin->id,
                'status' => 'in_progress',
                'priority' => 'medium',
                'budget' => 30000.00,
                'start_date' => now()->subDays(20),
                'deadline' => now()->addDays(25),
                'progress_percentage' => 65,
            ]
        );
        $p3->members()->sync([$developer->id, $superadmin->id]);

        // 7. Tasks Seeding
        Task::updateOrCreate(
            ['title' => 'Design Sanctum & Redis Session Pipeline'],
            [
                'project_id' => $p1->id,
                'assigned_to' => $developer->id,
                'created_by' => $superadmin->id,
                'description' => 'Implement token invalidation, Redis session metadata storing, and active status checks.',
                'status' => 'completed',
                'priority' => 'urgent',
                'estimated_hours' => 12,
                'logged_hours' => 11,
                'due_date' => now()->subDays(1),
                'completed_at' => now()->subDays(1),
            ]
        );

        Task::updateOrCreate(
            ['title' => 'Build Interactive Project & Task Kanban Matrix'],
            [
                'project_id' => $p1->id,
                'assigned_to' => $developer->id,
                'created_by' => $manager->id,
                'description' => 'Create Next.js interface with list and board view, filtering by project, status, priority, and team assignee.',
                'status' => 'in_progress',
                'priority' => 'high',
                'estimated_hours' => 16,
                'logged_hours' => 8,
                'due_date' => now()->addDays(4),
            ]
        );

        // 8. Estimates Seeding
        $est1 = Estimate::updateOrCreate(
            ['estimate_number' => 'EST-2026-001'],
            [
                'project_id' => $p2->id,
                'created_by' => $superadmin->id,
                'client_name' => 'Rajesh Sharma',
                'client_company' => 'Apex Infra Solutions Ltd',
                'client_email' => 'rajesh.sharma@apexinfra.in',
                'client_phone' => '+91 98200 12345',
                'client_address' => 'Bandra Kurla Complex, Mumbai, Maharashtra 400051',
                'estimate_date' => now()->toDateString(),
                'expiry_date' => now()->addDays(30)->toDateString(),
                'status' => 'sent',
                'currency' => 'INR',
                'tax_rate' => 18.00,
                'discount_rate' => 5.00,
                'notes' => 'Proposal includes 3 months warranty, architecture documentation, and staging deployment.',
                'terms_and_conditions' => 'Payment terms: 50% mobilization advance, 50% upon final acceptance testing. Valid for 30 days.',
            ]
        );
        $est1->items()->delete();
        $est1->items()->createMany([
            [
                'item_name' => 'Cloud Cluster Architecture & Redis Setup',
                'description' => 'High availability MariaDB master-slave and Redis cluster setup on AWS ECS',
                'quantity' => 40,
                'unit' => 'hours',
                'unit_price' => 2500.00,
                'amount' => 100000.00,
            ],
            [
                'item_name' => 'Enterprise Next.js & Tailwind Portal Design',
                'description' => 'Executive light-themed responsive portal with mobile-first layout',
                'quantity' => 100,
                'unit' => 'hours',
                'unit_price' => 2000.00,
                'amount' => 200000.00,
            ],
            [
                'item_name' => 'Quality Assurance & Automated CI/CD Pipelines',
                'description' => 'GitHub Actions deployment workflow, container tests, and load testing',
                'quantity' => 30,
                'unit' => 'hours',
                'unit_price' => 1800.00,
                'amount' => 54000.00,
            ],
        ]);
        $est1->recalculateTotals();

        $est2 = Estimate::updateOrCreate(
            ['estimate_number' => 'EST-2026-002'],
            [
                'project_id' => $p3->id,
                'created_by' => $manager->id,
                'client_name' => 'Ananya Sen',
                'client_company' => 'Kolkata FinTech Innovations',
                'client_email' => 'a.sen@kolkatafintech.in',
                'client_phone' => '+91 98310 98765',
                'client_address' => 'Sector V, Salt Lake, Kolkata, West Bengal 700091',
                'estimate_date' => now()->subDays(5)->toDateString(),
                'expiry_date' => now()->addDays(25)->toDateString(),
                'status' => 'accepted',
                'currency' => 'INR',
                'tax_rate' => 18.00,
                'discount_rate' => 0.00,
                'notes' => 'Accepted quotation for automated software documentation and AI portal pipeline.',
                'terms_and_conditions' => 'Net 30 days after invoice generation.',
            ]
        );
        $est2->items()->delete();
        $est2->items()->createMany([
            [
                'item_name' => 'Documentation AI Engine Core Module',
                'description' => 'Parsing engine for codebase reflection and automated markdown generation',
                'quantity' => 80,
                'unit' => 'hours',
                'unit_price' => 2200.00,
                'amount' => 176000.00,
            ],
            [
                'item_name' => 'API Integrations & Webhook System',
                'description' => 'Continuous repo hooks triggering live diagram updates',
                'quantity' => 45,
                'unit' => 'hours',
                'unit_price' => 1900.00,
                'amount' => 85500.00,
            ],
        ]);
        $est2->recalculateTotals();

        // Recalculate progress for all projects
        $p1->recalculateProgress();
        $p2->recalculateProgress();
        $p3->recalculateProgress();
    }
}
