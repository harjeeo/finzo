<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    /** The current authenticated request's decoded JWT payload. */
    protected function jwtPayload(Request $request): array
    {
        return $request->attributes->get('jwtPayload', []);
    }

    /** businessId of the currently authenticated user (equivalent of @CurrentBusinessId()). */
    protected function businessId(Request $request): ?string
    {
        return $this->jwtPayload($request)['businessId'] ?? null;
    }

    /** sub/email of the currently authenticated user, for audit logging (equivalent of @CurrentUser()). */
    protected function actor(Request $request): array
    {
        $payload = $this->jwtPayload($request);

        return [
            'userId' => $payload['sub'] ?? null,
            'userEmail' => $payload['email'] ?? null,
        ];
    }
}
