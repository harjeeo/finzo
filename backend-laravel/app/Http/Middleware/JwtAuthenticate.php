<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Equivalent of the previous NestJS JwtAuthGuard: verifies the bearer access
 * token and attaches its decoded payload to the request as 'jwtPayload'.
 */
class JwtAuthenticate
{
    public function __construct(private readonly JwtService $jwtService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $token = substr($header, 7);
        $payload = $this->jwtService->verifyAccessToken($token);

        if (! $payload) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $request->attributes->set('jwtPayload', $payload);

        return $next($request);
    }
}
