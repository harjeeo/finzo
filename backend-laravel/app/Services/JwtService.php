<?php

namespace App\Services;

use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use UnexpectedValueException;

/**
 * Signs and verifies the access/refresh token pair. Payload shape matches the
 * previous NestJS backend's JwtPayload exactly (sub, email, businessId, role,
 * isSuperAdmin) so the existing React frontend needs no changes.
 */
class JwtService
{
    public function buildTokens(array $payload): array
    {
        return [
            'accessToken' => $this->sign(
                $payload,
                config('services.jwt.access_secret'),
                (int) config('services.jwt.access_expires_in_minutes'),
            ),
            'refreshToken' => $this->sign(
                $payload,
                config('services.jwt.refresh_secret'),
                (int) config('services.jwt.refresh_expires_in_minutes'),
            ),
        ];
    }

    private function sign(array $payload, string $secret, int $expiresInMinutes): string
    {
        $now = time();
        $claims = array_merge($payload, [
            'iat' => $now,
            'exp' => $now + ($expiresInMinutes * 60),
        ]);

        return JWT::encode($claims, $secret, 'HS256');
    }

    /** Returns the decoded payload as an array, or null if invalid/expired. */
    public function verifyAccessToken(string $token): ?array
    {
        return $this->verify($token, config('services.jwt.access_secret'));
    }

    public function verifyRefreshToken(string $token): ?array
    {
        return $this->verify($token, config('services.jwt.refresh_secret'));
    }

    private function verify(string $token, string $secret): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));

            return (array) $decoded;
        } catch (ExpiredException|SignatureInvalidException|UnexpectedValueException) {
            return null;
        }
    }
}
