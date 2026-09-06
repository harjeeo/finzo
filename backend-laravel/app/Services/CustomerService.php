<?php

namespace App\Services;

use App\Models\Customer;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CustomerService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return Customer::where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Customer
    {
        $customer = Customer::where('business_id', $businessId)->find($id);

        if (! $customer) {
            throw new HttpException(404, 'Customer not found');
        }

        return $customer;
    }

    public function create(string $businessId, array $data, array $actor): Customer
    {
        $customer = Customer::create([
            'business_id' => $businessId,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'gstin' => $data['gstin'] ?? null,
            'address' => $data['address'] ?? null,
            'opening_balance' => $data['openingBalance'] ?? 0,
            'credit_limit' => $data['creditLimit'] ?? null,
        ]);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Customer',
            'entityId' => $customer->id,
            'action' => 'CREATE',
            'summary' => "Created customer \"{$customer->name}\"",
            'changes' => ['after' => $customer->toArray()],
        ]);

        return $customer;
    }

    public function update(string $businessId, string $id, array $data, array $actor): Customer
    {
        $customer = $this->findOne($businessId, $id);
        $before = $customer->toArray();

        $customer->fill([
            'name' => $data['name'] ?? $customer->name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $customer->phone,
            'email' => array_key_exists('email', $data) ? $data['email'] : $customer->email,
            'gstin' => array_key_exists('gstin', $data) ? $data['gstin'] : $customer->gstin,
            'address' => array_key_exists('address', $data) ? $data['address'] : $customer->address,
            'opening_balance' => $data['openingBalance'] ?? $customer->opening_balance,
            'credit_limit' => array_key_exists('creditLimit', $data) ? $data['creditLimit'] : $customer->credit_limit,
        ]);
        $customer->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Customer',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated customer \"{$customer->name}\"",
            'changes' => ['before' => $before, 'after' => $customer->toArray()],
        ]);

        return $customer;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $customer = $this->findOne($businessId, $id);

        DB::transaction(function () use ($customer, $businessId, $actor) {
            $before = $customer->toArray();
            $customer->delete();

            $this->auditService->log([
                'businessId' => $businessId,
                'userId' => $actor['userId'],
                'userEmail' => $actor['userEmail'],
                'entityType' => 'Customer',
                'entityId' => $customer->id,
                'action' => 'DELETE',
                'summary' => "Deleted customer \"{$customer->name}\"",
                'changes' => ['before' => $before],
            ]);
        });

        return ['success' => true];
    }
}
