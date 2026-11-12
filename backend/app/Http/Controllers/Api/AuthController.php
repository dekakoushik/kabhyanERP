<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;
use App\Models\User;
use App\Services\MailNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

    /**
     * Send password reset email token.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = strtolower(trim($request->email));
        $user = User::where('email', $email)->first();

        if ($user && $user->status === 'active') {
            $token = bin2hex(random_bytes(32));

            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                [
                    'token' => $token,
                    'created_at' => now(),
                ]
            );

            MailNotificationService::sendPasswordReset($user, $token);
        }

        return response()->json([
            'message' => 'If this email is registered in Kabhyan ERP, a password reset link has been dispatched to your inbox.',
        ]);
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = strtolower(trim($request->email));
        $token = trim($request->token);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record || $record->token !== $token) {
            return response()->json([
                'message' => 'Invalid or expired password reset link.',
            ], 422);
        }

        $createdAt = Carbon::parse($record->created_at);
        if ($createdAt->addMinutes(60)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'message' => 'This password reset link has expired (valid for 60 minutes). Please request a new one.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'User account not found.',
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Revoke token record
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Revoke tokens
        $user->tokens()->delete();

        // Notification
        SystemNotification::createNotification(
            $user->id,
            'auth',
            'Password Successfully Reset',
            'Your account password has been updated. You can now log in.',
            '/login'
        );

        return response()->json([
            'message' => 'Your password has been reset successfully. You can now log in.',
        ]);
    }

    /**
     * Verify invitation token for client account activation.
     */
    public function verifyInvitation(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $email = strtolower(trim($request->email));
        $token = trim($request->token);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record || $record->token !== $token) {
            return response()->json([
                'valid' => false,
                'message' => 'The activation link is invalid or has already been used.',
            ], 422);
        }

        // Invitations are valid for 48 hours
        $createdAt = Carbon::parse($record->created_at);
        if ($createdAt->addHours(48)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'valid' => false,
                'message' => 'This invitation link has expired (valid for 48 hours). Please ask your account manager to resend an invite.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'valid' => false,
                'message' => 'Client account not found.',
            ], 404);
        }

        return response()->json([
            'valid' => true,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role,
            'expires_at' => $createdAt->addHours(48)->toIso8601String(),
        ]);
    }

    /**
     * Activate client account and establish private password for mobile application.
     */
    public function activateAccount(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = strtolower(trim($request->email));
        $token = trim($request->token);

        $record = DB::table('password_reset_tokens')->where('email', $email)->first();

        if (!$record || $record->token !== $token) {
            return response()->json([
                'message' => 'Invalid or expired activation link.',
            ], 422);
        }

        $createdAt = Carbon::parse($record->created_at);
        if ($createdAt->addHours(48)->isPast()) {
            DB::table('password_reset_tokens')->where('email', $email)->delete();
            return response()->json([
                'message' => 'This invitation link has expired. Please ask your administrator to send a new invitation.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'User account not found.',
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
            'status' => 'active',
        ]);

        // Consume activation token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

        // Ensure associated Client record is marked active
        $client = \App\Models\Client::where('email', $email)->orWhere('user_id', $user->id)->first();
        if ($client) {
            $client->update(['portal_access_status' => 'active']);
        }

        // Notification
        SystemNotification::createNotification(
            $user->id,
            'auth',
            'Account Activated',
            'Your client account has been activated. You can now log into the Kabhyan Client Mobile App.',
            '/login'
        );

        return response()->json([
            'message' => 'Account successfully activated! Your password has been configured.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }
}

