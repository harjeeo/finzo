<?php

namespace App\Services;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StaffService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return Membership::with('user:id,name,email')
            ->where('business_id', $businessId)
            ->orderBy('created_at')
            ->get();
    }

    public function create(string $businessId, array $data, array $actor): Membership
    {
        $user = User::where('email', $data['email'])->first();

        if ($user) {
            $existing = Membership::where('user_id', $user->id)->where('business_id', $businessId)->first();
            if ($existing) {
                throw new HttpException(409, 'This user is already a member of this business');
            }
        } else {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password_hash' => Hash::make($data['password']),
            ]);
        }

        $membership = Membership::create([
            'user_id' => $user->id,
            'business_id' => $businessId,
            'role' => $data['role'],
        ]);
        $membership->load('user:id,name,email');

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Staff',
            'entityId' => $membership->id,
            'action' => 'CREATE',
            'summary' => "Added staff member \"{$membership->user->email}\" as {$membership->role}",
            'changes' => ['after' => $membership->toArray()],
        ]);

        return $membership;
    }

    public function update(string $businessId, string $membershipId, string $role, array $actor): Membership
    {
        $membership = Membership::with('user:id,name,email')
            ->where('id', $membershipId)->where('business_id', $businessId)->first();

        if (! $membership) {
            throw new HttpException(404, 'Staff member not found');
        }
        if ($membership->role === 'OWNER') {
            throw new HttpException(400, "The business owner's role can't be changed");
        }

        $before = $membership->toArray();
        $membership->role = $role;
        $membership->save();
        $membership->load('user:id,name,email');

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Staff',
            'entityId' => $membershipId,
            'action' => 'UPDATE',
            'summary' => "Changed \"{$membership->user->email}\" role from {$before['role']} to {$role}",
            'changes' => ['before' => $before, 'after' => $membership->toArray()],
        ]);

        return $membership;
    }

    public function remove(string $businessId, string $membershipId, array $actor): array
    {
        $membership = Membership::with('user:id,name,email')
            ->where('id', $membershipId)->where('business_id', $businessId)->first();

        if (! $membership) {
            throw new HttpException(404, 'Staff member not found');
        }
        if ($membership->role === 'OWNER') {
            throw new HttpException(400, 'The business owner cannot be removed');
        }

        $before = $membership->toArray();
        $membership->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Staff',
            'entityId' => $membershipId,
            'action' => 'DELETE',
            'summary' => "Removed staff member \"{$membership->user->email}\"",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }
}
