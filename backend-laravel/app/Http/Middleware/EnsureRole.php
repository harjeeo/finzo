<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Equivalent of the previous NestJS RolesGuard: OWNER always passes, everyone
 * else must have one of the roles listed on the route (roles:MANAGER,CASHIER).
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $payload = $request->attributes->get('jwtPayload');
        $role = $payload['role'] ?? null;

        if ($role === 'OWNER') {
            return $next($request);
        }

        if (! $role || ! in_array($role, $allowedRoles, true)) {
            return response()->json([
                'message' => 'You do not have permission to perform this action',
            ], 403);
        }

        return $next($request);
    }
}
