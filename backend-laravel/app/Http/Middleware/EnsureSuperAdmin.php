<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Equivalent of the previous NestJS SuperAdminGuard. */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $payload = $request->attributes->get('jwtPayload');

        if (empty($payload['isSuperAdmin'])) {
            return response()->json(['message' => 'Platform admin access required'], 403);
        }

        return $next($request);
    }
}
