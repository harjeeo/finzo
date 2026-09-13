<?php

namespace App\Services;

use App\Models\PriceList;
use App\Models\PriceListItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PriceListService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return PriceList::with('items.product')
            ->where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): PriceList
    {
        $priceList = PriceList::with('items.product')
            ->where('business_id', $businessId)
            ->find($id);

        if (! $priceList) {
            throw new HttpException(404, 'Price list not found');
        }

        return $priceList;
    }

    public function create(string $businessId, array $data, array $actor): PriceList
    {
        $existing = PriceList::where('business_id', $businessId)->where('name', $data['name'])->first();
        if ($existing) {
            throw new HttpException(400, 'A price list with this name already exists');
        }

        $priceList = DB::transaction(function () use ($businessId, $data) {
            if (! empty($data['isDefault'])) {
                PriceList::where('business_id', $businessId)->update(['is_default' => false]);
            }

            $priceList = PriceList::create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'is_default' => $data['isDefault'] ?? false,
            ]);

            if (! empty($data['items'])) {
                foreach ($data['items'] as $item) {
                    PriceListItem::create([
                        'price_list_id' => $priceList->id,
                        'product_id' => $item['productId'],
                        'price' => $item['price'],
                    ]);
                }
            }

            return $priceList->fresh(['items.product']);
        });

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PriceList',
            'entityId' => $priceList->id,
            'action' => 'CREATE',
            'summary' => "Created price list \"{$priceList->name}\"",
            'changes' => ['after' => $priceList->toArray()],
        ]);

        return $priceList;
    }

    public function update(string $businessId, string $id, array $data, array $actor): PriceList
    {
        $before = $this->findOne($businessId, $id);

        $priceList = DB::transaction(function () use ($businessId, $id, $data) {
            if (! empty($data['isDefault'])) {
                PriceList::where('business_id', $businessId)->update(['is_default' => false]);
            }

            $priceList = PriceList::where('business_id', $businessId)->findOrFail($id);
            $priceList->fill([
                'name' => $data['name'] ?? $priceList->name,
                'is_default' => array_key_exists('isDefault', $data) ? $data['isDefault'] : $priceList->is_default,
            ]);
            $priceList->save();

            return $priceList->fresh(['items.product']);
        });

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PriceList',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated price list \"{$priceList->name}\"",
            'changes' => ['before' => $before->toArray(), 'after' => $priceList->toArray()],
        ]);

        return $priceList;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $priceList = $this->findOne($businessId, $id);
        $customerCount = \App\Models\Customer::where('price_list_id', $id)->count();
        if ($customerCount > 0) {
            throw new HttpException(400, "Cannot delete this price list — {$customerCount} customer(s) are assigned to it");
        }

        $priceList->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PriceList',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted price list \"{$priceList->name}\"",
            'changes' => ['before' => $priceList->toArray()],
        ]);

        return ['success' => true];
    }

    public function setItem(string $businessId, string $priceListId, string $productId, array $data): PriceListItem
    {
        $this->findOne($businessId, $priceListId);
        $product = Product::where('id', $productId)->where('business_id', $businessId)->first();
        if (! $product) {
            throw new HttpException(400, 'Product not found');
        }

        $item = PriceListItem::where('price_list_id', $priceListId)->where('product_id', $productId)->first();
        if ($item) {
            $item->price = $data['price'];
            $item->save();
        } else {
            $item = PriceListItem::create([
                'price_list_id' => $priceListId,
                'product_id' => $productId,
                'price' => $data['price'],
            ]);
        }

        return $item->fresh('product');
    }

    public function removeItem(string $businessId, string $priceListId, string $productId): array
    {
        $this->findOne($businessId, $priceListId);
        PriceListItem::where('price_list_id', $priceListId)->where('product_id', $productId)->delete();

        return ['success' => true];
    }
}
