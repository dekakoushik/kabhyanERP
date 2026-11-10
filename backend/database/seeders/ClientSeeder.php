<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create client portal user login account
        $clientUser = User::firstOrCreate(
            ['email' => 'client@kolkatafintech.in'],
            [
                'name' => 'Ananya Sen',
                'role' => 'client',
                'phone' => '+91 98310 98765',
                'password' => Hash::make('Client@2026'),
                'status' => 'active',
            ]
        );

        // 2. Create client record
        $client = Client::firstOrCreate(
            ['email' => 'client@kolkatafintech.in'],
            [
                'user_id' => $clientUser->id,
                'client_code' => 'CLI-2026-001',
                'name' => 'Ananya Sen',
                'company_name' => 'Kolkata FinTech Innovations Pvt Ltd',
                'phone' => '+91 98310 98765',
                'gstin' => '19AAECK4829K1ZX',
                'address' => 'Infinity Benchmark, 14th Floor, Sector V, Salt Lake',
                'city' => 'Kolkata',
                'state' => 'West Bengal',
                'country' => 'India',
                'portal_access_status' => 'active',
                'notes' => 'Key Enterprise Banking & FinTech Client',
            ]
        );

        // 3. Associate with existing projects
        $project = Project::first();
        if ($project) {
            $project->update([
                'client_id' => $client->id,
                'client_name' => $client->company_name,
            ]);
        }

        // 4. Create sample tickets for this client
        $adminUser = User::where('role', 'superadmin')->first();

        $ticket1 = Ticket::firstOrCreate(
            ['ticket_number' => 'TIK-2026-001'],
            [
                'client_id' => $client->id,
                'project_id' => $project?->id,
                'assigned_to' => $adminUser?->id,
                'subject' => 'Production Webhook Payload signature verification issue',
                'type' => 'issue',
                'priority' => 'high',
                'status' => 'in_progress',
                'description' => 'When triggering webhooks for bank reconciliation, HMAC SHA-256 header validation intermittently returns mismatch on payload with UTF-8 characters.',
            ]
        );

        TicketReply::firstOrCreate(
            [
                'ticket_id' => $ticket1->id,
                'message' => 'Hello Ananya, our backend team is inspecting the raw request payload buffer encoding. We will patch the middleware within 2 hours.',
            ],
            [
                'user_id' => $adminUser?->id,
                'is_staff_reply' => true,
            ]
        );

        $ticket2 = Ticket::firstOrCreate(
            ['ticket_number' => 'TIK-2026-002'],
            [
                'client_id' => $client->id,
                'project_id' => $project?->id,
                'assigned_to' => $adminUser?->id,
                'subject' => 'Request to add CSV and Excel statement batch export',
                'type' => 'change_request',
                'priority' => 'medium',
                'status' => 'open',
                'description' => 'Our finance operations team needs an instant download of monthly reconciliation reports in .xlsx format alongside PDF.',
            ]
        );
    }
}

