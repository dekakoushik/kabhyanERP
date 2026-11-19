<?php

use App\Models\Client;
use App\Models\Project;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

/**
 * Private User Channel (Personal Notifications & In-App Alerts)
 */
Broadcast::channel('user.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
}, ['guards' => ['sanctum']]);

/**
 * Private Project Channel (Document Requests, Status Changes, Task Visibility)
 */
Broadcast::channel('project.{projectId}', function (User $user, $projectId) {
    $project = Project::find($projectId);
    if (!$project) {
        return false;
    }

    // Allow staff & admin team members
    if (in_array($user->role, ['superadmin', 'admin', 'manager', 'employee'])) {
        return true;
    }

    // Allow project's designated client account
    $client = Client::where('user_id', $user->id)->first() ?? Client::where('email', $user->email)->first();
    if ($client && (int) $project->client_id === (int) $client->id) {
        return true;
    }

    return false;
}, ['guards' => ['sanctum']]);

/**
 * Private Ticket Channel (Live Ticket Replies & Thread Chat)
 */
Broadcast::channel('ticket.{ticketId}', function (User $user, $ticketId) {
    $ticket = Ticket::find($ticketId);
    if (!$ticket) {
        return false;
    }

    // Allow staff & admin team members
    if (in_array($user->role, ['superadmin', 'admin', 'manager', 'employee'])) {
        return true;
    }

    // Allow ticket's creator client account
    $client = Client::where('user_id', $user->id)->first() ?? Client::where('email', $user->email)->first();
    if ($client && (int) $ticket->client_id === (int) $client->id) {
        return true;
    }

    return false;
}, ['guards' => ['sanctum']]);

/**
 * Private Client Channel (Commercial Invoices, Receipts, Milestone Announcements)
 */
Broadcast::channel('client.{clientId}', function (User $user, $clientId) {
    if (in_array($user->role, ['superadmin', 'admin', 'manager', 'employee'])) {
        return true;
    }

    $client = Client::where('user_id', $user->id)->first() ?? Client::where('email', $user->email)->first();
    return $client && (int) $client->id === (int) $clientId;
}, ['guards' => ['sanctum']]);
