<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Godown;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthService
{
    public function __construct(private readonly JwtService $jwtService) {}

    private function isDesignatedSuperAdmin(string $email): bool
    {
        $list = config('services.super_admin_emails') ?? '';

        $emails = array_filter(array_map(
            fn ($e) => strtolower(trim($e)),
            explode(',', $list),
        ));

        return in_array(strtolower($email), $emails, true);
    }

    public function register(array $data): array
    {
        if (User::where('email', $data['email'])->exists()) {
            throw new HttpException(409, 'An account with this email already exists');
        }

        $isSuperAdmin = $this->isDesignatedSuperAdmin($data['email']);

        [$user, $business] = DB::transaction(function () use ($data, $isSuperAdmin) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
                'is_super_admin' => $isSuperAdmin,
            ]);

            $business = Business::create([
                'name' => $data['businessName'],
            ]);

            Membership::create([
                'user_id' => $user->id,
                'business_id' => $business->id,
                'role' => 'OWNER',
            ]);

            $branch = Branch::create([
                'business_id' => $business->id,
                'name' => 'Main Branch',
                'is_default' => true,
            ]);

            Godown::create([
                'business_id' => $business->id,
                'branch_id' => $branch->id,
                'name' => 'Main Godown',
                'is_default' => true,
            ]);

            foreach (config('default_accounts') as $account) {
                Account::create([
                    'business_id' => $business->id,
                    'code' => $account['code'],
                    'name' => $account['name'],
                    'type' => $account['type'],
                    'is_system' => true,
                    'is_bank_account' => in_array($account['code'], ['CASH', 'BANK'], true),
                ]);
            }

            return [$user, $business];
        });

        return $this->jwtService->buildTokens([
            'sub' => $user->id,
            'email' => $user->email,
            'businessId' => $business->id,
            'role' => 'OWNER',
            'isSuperAdmin' => $user->is_super_admin,
        ]);
    }

    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password_hash)) {
            throw new HttpException(401, 'Invalid email or password');
        }

        if (! $user->is_super_admin && $this->isDesignatedSuperAdmin($user->email)) {
            $user->is_super_admin = true;
            $user->save();
        }

        $membership = Membership::where('user_id', $user->id)->first();

        if ($membership) {
            $business = Business::find($membership->business_id);
            if ($business?->status === 'SUSPENDED') {
                throw new HttpException(403, 'This business account has been suspended. Please contact support.');
            }
        }

        return $this->jwtService->buildTokens([
            'sub' => $user->id,
            'email' => $user->email,
            'businessId' => $membership?->business_id,
            'role' => $membership?->role,
            'isSuperAdmin' => $user->is_super_admin,
        ]);
    }

    public function refresh(string $refreshToken): array
    {
        $payload = $this->jwtService->verifyRefreshToken($refreshToken);

        if (! $payload) {
            throw new HttpException(401, 'Invalid or expired refresh token');
        }

        $user = User::find($payload['sub']);

        if (! $user) {
            throw new HttpException(401, 'Invalid refresh token');
        }

        if (! empty($payload['businessId'])) {
            $business = Business::find($payload['businessId']);
            if ($business?->status === 'SUSPENDED') {
                throw new HttpException(403, 'This business account has been suspended. Please contact support.');
            }
        }

        return $this->jwtService->buildTokens([
            'sub' => $user->id,
            'email' => $user->email,
            'businessId' => $payload['businessId'] ?? null,
            'role' => $payload['role'] ?? null,
            'isSuperAdmin' => $user->is_super_admin,
        ]);
    }
}
