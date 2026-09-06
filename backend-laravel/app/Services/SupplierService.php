<?php

namespace App\Services;

use App\Models\Supplier;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SupplierService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return Supplier::where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Supplier
    {
        $supplier = Supplier::where('business_id', $businessId)->find($id);

        if (! $supplier) {
            throw new HttpException(404, 'Supplier not found');
        }

        return $supplier;
    }

    public function create(string $businessId, array $data, array $actor): Supplier
    {
        $supplier = Supplier::create([
            'business_id' => $businessId,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'gstin' => $data['gstin'] ?? null,
            'address' => $data['address'] ?? null,
            'opening_balance' => $data['openingBalance'] ?? 0,
        ]);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Supplier',
            'entityId' => $supplier->id,
            'action' => 'CREATE',
            'summary' => "Created supplier \"{$supplier->name}\"",
            'changes' => ['after' => $supplier->toArray()],
        ]);

        return $supplier;
    }

    public function update(string $businessId, string $id, array $data, array $actor): Supplier
    {
        $supplier = $this->findOne($businessId, $id);
        $before = $supplier->toArray();

        $supplier->fill([
            'name' => $data['name'] ?? $supplier->name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $supplier->phone,
            'email' => array_key_exists('email', $data) ? $data['email'] : $supplier->email,
            'gstin' => array_key_exists('gstin', $data) ? $data['gstin'] : $supplier->gstin,
            'address' => array_key_exists('address', $data) ? $data['address'] : $supplier->address,
            'opening_balance' => $data['openingBalance'] ?? $supplier->opening_balance,
        ]);
        $supplier->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Supplier',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated supplier \"{$supplier->name}\"",
            'changes' => ['before' => $before, 'after' => $supplier->toArray()],
        ]);

        return $supplier;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $supplier = $this->findOne($businessId, $id);
        $before = $supplier->toArray();
        $supplier->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Supplier',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted supplier \"{$supplier->name}\"",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }
}
