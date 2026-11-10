<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user login and issue token.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Your account is ' . $user->status . '. Please contact the SuperAdmin.',
            ], 403);
        }

        // Track last login
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Revoke prior tokens for security if desired, or keep multiple devices
        $token = $user->createToken('kabhyan_auth_token')->plainTextToken;

        // Cache session indicator in Redis for audit & instant logout support
        try {
            Redis::setex("user_session:{$user->id}", 86400, json_encode([
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'login_time' => now()->toIso8601String(),
                'ip' => $request->ip(),
            ]));
        } catch (\Throwable $e) {
            // Redis fallback if offline
        }

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'department' => $user->department,
                'designation' => $user->designation,
                'status' => $user->status,
                'last_login_at' => $user->last_login_at,
            ],
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * Logout and revoke tokens.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->currentAccessToken()->delete();

            try {
                Redis::del("user_session:{$user->id}");
            } catch (\Throwable $e) {
                // Redis fail-safe
            }
        }

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }
}

