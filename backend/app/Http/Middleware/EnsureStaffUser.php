<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStaffUser
{
    /**
     * Handle an incoming request.
     * Ensures that the authenticated user is an internal staff member (not an external client).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role === 'client') {
            return response()->json([
                'message' => 'Unauthorized. Staff privileges required to access internal ERP resources.',
            ], 403);
        }

        return $next($request);
    }
}
