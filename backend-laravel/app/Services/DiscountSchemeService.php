<?php

namespace App\Services;

use App\Models\DiscountScheme;
use App\Models\Product;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DiscountSchemeService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return DiscountScheme::with('product')
            ->where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): DiscountScheme
    {
        $scheme = DiscountScheme::with('product')
            ->where('business_id', $businessId)
            ->find($id);

        if (! $scheme) {
            throw new HttpException(404, 'Discount scheme not found');
        }

        return $scheme;
    }

    public function create(string $businessId, array $data, array $actor): DiscountScheme
    {
        if (! empty($data['productId'])) {
            $product = Product::where('id', $data['productId'])->where('business_id', $businessId)->first();
            if (! $product) {
                throw new HttpException(400, 'Product not found');
            }
        }
        if ($data['discountType'] === 'PERCENTAGE' && $data['value'] > 100) {
            throw new HttpException(400, 'Percentage discount cannot exceed 100');
        }

        $scheme = DiscountScheme::create([
            'business_id' => $businessId,
            'name' => $data['name'],
            'discount_type' => $data['discountType'],
            'value' => $data['value'],
            'product_id' => $data['productId'] ?? null,
            'min_quantity' => $data['minQuantity'] ?? 0,
            'start_date' => $data['startDate'] ?? null,
            'end_date' => $data['endDate'] ?? null,
            'is_active' => $data['isActive'] ?? true,
        ]);
        $scheme = $scheme->fresh('product');

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'DiscountScheme',
            'entityId' => $scheme->id,
            'action' => 'CREATE',
            'summary' => "Created discount scheme \"{$scheme->name}\"",
            'changes' => ['after' => $scheme->toArray()],
        ]);

        return $scheme;
    }

    public function update(string $businessId, string $id, array $data, array $actor): DiscountScheme
    {
        $before = $this->findOne($businessId, $id);

        if (! empty($data['productId'])) {
            $product = Product::where('id', $data['productId'])->where('business_id', $businessId)->first();
            if (! $product) {
                throw new HttpException(400, 'Product not found');
            }
        }

        $scheme = DiscountScheme::where('business_id', $businessId)->findOrFail($id);
        $scheme->fill([
            'name' => $data['name'] ?? $scheme->name,
            'discount_type' => $data['discountType'] ?? $scheme->discount_type,
            'value' => $data['value'] ?? $scheme->value,
            'product_id' => array_key_exists('productId', $data) ? $data['productId'] : $scheme->product_id,
            'min_quantity' => array_key_exists('minQuantity', $data) ? $data['minQuantity'] : $scheme->min_quantity,
            'start_date' => array_key_exists('startDate', $data) ? $data['startDate'] : $scheme->start_date,
            'end_date' => array_key_exists('endDate', $data) ? $data['endDate'] : $scheme->end_date,
            'is_active' => array_key_exists('isActive', $data) ? $data['isActive'] : $scheme->is_active,
        ]);
        $scheme->save();
        $scheme = $scheme->fresh('product');

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'DiscountScheme',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated discount scheme \"{$scheme->name}\"",
            'changes' => ['before' => $before->toArray(), 'after' => $scheme->toArray()],
        ]);

        return $scheme;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $scheme = $this->findOne($businessId, $id);
        $scheme->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'DiscountScheme',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted discount scheme \"{$scheme->name}\"",
            'changes' => ['before' => $scheme->toArray()],
        ]);

        return ['success' => true];
    }
}
