<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    /**
     * List all clients with their projects, tickets and invoice stats.
     */
    public function index(Request $request)
    {
        $query = Client::with(['user', 'projects'])->withCount(['projects', 'tickets']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('client_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('portal_access_status', $request->status);
        }

        $clients = $query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 20));

        $stats = [
            'total_clients' => Client::count(),
            'active_portal_users' => Client::where('portal_access_status', 'active')->count(),
            'total_active_projects' => Client::has('projects')->count(),
        ];

        return response()->json([
            'clients' => $clients,
            'stats' => $stats,
        ]);
    }

    /**
     * Store new client. Can optionally create Portal Login account.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email',
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:25',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'create_portal_account' => 'nullable|boolean',
            'portal_password' => 'nullable|string|min:6',
        ]);

        $count = Client::count() + 1;
        $clientCode = 'CLI-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        while (Client::where('client_code', $clientCode)->exists()) {
            $count++;
            $clientCode = 'CLI-' . date('Y') . '-' . str_pad($count, 3, '0', STR_PAD_LEFT);
        }

        $userId = null;
        if (!empty($validated['create_portal_account'])) {
            $password = !empty($validated['portal_password']) ? $validated['portal_password'] : 'Kabhyan@' . date('Y');
            $user = User::firstOrCreate(
                ['email' => $validated['email']],
                [
                    'name' => $validated['name'],
                    'role' => 'client',
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make($password),
                    'status' => 'active',
                ]
            );
            $userId = $user->id;
        }

        $client = Client::create([
            'user_id' => $userId,
            'client_code' => $clientCode,
            'name' => $validated['name'],
            'company_name' => $validated['company_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'gstin' => $validated['gstin'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? 'West Bengal',
            'country' => $validated['country'] ?? 'India',
            'portal_access_status' => 'active',
            'notes' => $validated['notes'] ?? null,
        ]);

        $client->load(['user', 'projects']);

        return response()->json([
            'message' => 'Client created successfully.',
            'client' => $client,
        ], 201);
    }

    /**
     * Show single client details.
     */
    public function show(Client $client)
    {
        $client->load(['user', 'projects.tasks', 'tickets.replies']);
        return response()->json(['client' => $client]);
    }

    /**
     * Update client profile.
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email,' . $client->id,
            'phone' => 'nullable|string|max:20',
            'gstin' => 'nullable|string|max:25',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'portal_access_status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string',
            'reset_portal_password' => 'nullable|string|min:6',
        ]);

        $client->update([
            'name' => $validated['name'],
            'company_name' => $validated['company_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'gstin' => $validated['gstin'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? 'West Bengal',
            'country' => $validated['country'] ?? 'India',
            'portal_access_status' => $validated['portal_access_status'] ?? $client->portal_access_status,
            'notes' => $validated['notes'] ?? null,
        ]);

        // If client doesn't have portal user account, or reset password is provided
        if ($client->user_id) {
            $user = User::find($client->user_id);
            if ($user) {
                $userUpdate = ['name' => $validated['name'], 'email' => $validated['email']];
                if (!empty($validated['reset_portal_password'])) {
                    $userUpdate['password'] = Hash::make($validated['reset_portal_password']);
                }
                $user->update($userUpdate);
            }
        } elseif (!empty($validated['reset_portal_password'])) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => 'client',
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($validated['reset_portal_password']),
                'status' => 'active',
            ]);
            $client->update(['user_id' => $user->id]);
        }

        $client->load(['user', 'projects']);

        return response()->json([
            'message' => 'Client updated successfully.',
            'client' => $client,
        ]);
    }

    /**
     * Delete client.
     */
    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(['message' => 'Client deleted successfully.']);
    }
}

