<?php

namespace App\Services;

use App\Models\Business;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BusinessService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findOne(string $businessId): Business
    {
        $business = Business::find($businessId);

        if (! $business) {
            throw new HttpException(404, 'Business not found');
        }

        return $business;
    }

    public function update(string $businessId, array $data, array $actor): Business
    {
        $business = $this->findOne($businessId);
        $before = $business->toArray();

        $map = [
            'name' => 'name', 'gstin' => 'gstin', 'pan' => 'pan', 'address' => 'address',
            'city' => 'city', 'state' => 'state', 'pincode' => 'pincode',
            'invoicePrefix' => 'invoice_prefix', 'currency' => 'currency',
        ];
        foreach ($map as $requestKey => $column) {
            if (array_key_exists($requestKey, $data)) {
                $business->{$column} = $data[$requestKey];
            }
        }
        $business->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Business',
            'entityId' => $businessId,
            'action' => 'UPDATE',
            'summary' => 'Updated business settings',
            'changes' => ['before' => $before, 'after' => $business->toArray()],
        ]);

        return $business;
    }
}
