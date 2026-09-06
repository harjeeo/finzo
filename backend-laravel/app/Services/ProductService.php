<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductUnit;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ProductService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly BranchService $branchService,
        private readonly GodownService $godownService,
        private readonly StockService $stockService,
    ) {}

    public function findAll(string $businessId)
    {
        return Product::with('units')
            ->where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Product
    {
        $product = Product::with('units')->where('business_id', $businessId)->find($id);

        if (! $product) {
            throw new HttpException(404, 'Product not found');
        }

        return $product;
    }

    public function listUnits(string $businessId, string $productId)
    {
        $this->findOne($businessId, $productId);

        return ProductUnit::where('product_id', $productId)->orderBy('created_at')->get();
    }

    public function createUnit(string $businessId, string $productId, array $data): ProductUnit
    {
        $product = $this->findOne($businessId, $productId);

        if (strtolower(trim($data['name'])) === strtolower(trim($product->unit))) {
            throw new HttpException(400, "\"{$data['name']}\" is already this product's base unit");
        }

        $existing = ProductUnit::where('product_id', $productId)->where('name', $data['name'])->first();
        if ($existing) {
            throw new HttpException(400, 'A unit with this name already exists for this product');
        }

        return ProductUnit::create([
            'product_id' => $productId,
            'name' => $data['name'],
            'conversion_factor' => $data['conversionFactor'],
        ]);
    }

    public function updateUnit(string $businessId, string $productId, string $unitId, array $data): ProductUnit
    {
        $this->findOne($businessId, $productId);

        $unit = ProductUnit::where('id', $unitId)->where('product_id', $productId)->first();
        if (! $unit) {
            throw new HttpException(404, 'Unit not found');
        }

        $unit->fill([
            'name' => $data['name'] ?? $unit->name,
            'conversion_factor' => $data['conversionFactor'] ?? $unit->conversion_factor,
        ]);
        $unit->save();

        return $unit;
    }

    public function removeUnit(string $businessId, string $productId, string $unitId): array
    {
        $this->findOne($businessId, $productId);

        $unit = ProductUnit::where('id', $unitId)->where('product_id', $productId)->first();
        if (! $unit) {
            throw new HttpException(404, 'Unit not found');
        }
        $unit->delete();

        return ['success' => true];
    }

    public function create(string $businessId, array $data, array $actor): Product
    {
        $openingStock = $data['openingStock'] ?? 0;

        $product = DB::transaction(function () use ($businessId, $data, $openingStock) {
            $created = Product::create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'sku' => $data['sku'] ?? null,
                'barcode' => $data['barcode'] ?? null,
                'category' => $data['category'] ?? null,
                'unit' => $data['unit'] ?? 'PCS',
                'hsn_code' => $data['hsnCode'] ?? null,
                'purchase_price' => $data['purchasePrice'] ?? 0,
                'selling_price' => $data['sellingPrice'] ?? 0,
                'gst_rate' => $data['gstRate'] ?? 0,
                'opening_stock' => $openingStock,
                'current_stock' => 0,
                'min_stock_level' => $data['minStockLevel'] ?? 0,
                'tracks_batches' => $data['tracksBatches'] ?? false,
            ]);

            if ($openingStock <= 0) {
                return $created;
            }

            $defaultBranch = $this->branchService->getOrCreateDefaultBranch($businessId);
            $defaultGodown = $this->godownService->getOrCreateDefaultGodown($businessId, $defaultBranch->id);

            $this->stockService->receiveExisting([
                'businessId' => $businessId,
                'productId' => $created->id,
                'godownId' => $defaultGodown->id,
                'batchId' => null,
                'quantity' => $openingStock,
                'sourceType' => 'ADJUSTMENT',
                'sourceId' => $created->id,
            ]);

            return $created->fresh();
        });

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Product',
            'entityId' => $product->id,
            'action' => 'CREATE',
            'summary' => "Created product \"{$product->name}\"",
            'changes' => ['after' => $product->toArray()],
        ]);

        return $product->load('units');
    }

    public function update(string $businessId, string $id, array $data, array $actor): Product
    {
        $product = $this->findOne($businessId, $id);
        $before = $product->toArray();

        $map = [
            'name' => 'name', 'sku' => 'sku', 'barcode' => 'barcode', 'category' => 'category',
            'unit' => 'unit', 'hsnCode' => 'hsn_code', 'purchasePrice' => 'purchase_price',
            'sellingPrice' => 'selling_price', 'gstRate' => 'gst_rate',
            'openingStock' => 'opening_stock', 'minStockLevel' => 'min_stock_level',
            'tracksBatches' => 'tracks_batches',
        ];
        foreach ($map as $requestKey => $column) {
            if (array_key_exists($requestKey, $data)) {
                $product->{$column} = $data[$requestKey];
            }
        }
        $product->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Product',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated product \"{$product->name}\"",
            'changes' => ['before' => $before, 'after' => $product->toArray()],
        ]);

        return $product;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $product = $this->findOne($businessId, $id);
        $before = $product->toArray();
        $product->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Product',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted product \"{$product->name}\"",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }
}
