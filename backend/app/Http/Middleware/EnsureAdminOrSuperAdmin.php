<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminOrSuperAdmin
{
    /**
     * Handle an incoming request.
     * Ensures that the authenticated user possesses administrative privileges (Admin or SuperAdmin).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, ['superadmin', 'admin'])) {
            return response()->json([
                'message' => 'Unauthorized. Administrative privileges required.',
            ], 403);
        }

        return $next($request);
    }
}
