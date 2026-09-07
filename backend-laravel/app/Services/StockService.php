<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Ports the NestJS StockService one method at a time as the modules that need
 * them get ported. adjustStock/receiveExisting/receive/remove/consumeSimple/
 * consumeFefo exist so far (used by Products' openingStock, Purchases, and
 * Sales); restoreBatches/getStockByProduct/getExpiryReport land later.
 */
class StockService
{
    private function findOrCreateBatch(string $businessId, string $productId, array $info): Batch
    {
        $existing = Batch::where('product_id', $productId)->where('batch_number', $info['batchNumber'])->first();
        if ($existing) {
            return $existing;
        }

        return Batch::create([
            'business_id' => $businessId,
            'product_id' => $productId,
            'batch_number' => $info['batchNumber'],
            'manufacture_date' => $info['manufactureDate'] ?? null,
            'expiry_date' => $info['expiryDate'] ?? null,
        ]);
    }

    private function adjustStock(array $params): void
    {
        $existing = ProductStock::where('product_id', $params['productId'])
            ->where('godown_id', $params['godownId'])
            ->where('batch_id', $params['batchId'])
            ->first();

        $newQuantity = (float) ($existing->quantity ?? 0) + $params['quantityDelta'];
        if ($newQuantity < 0) {
            throw new HttpException(400, 'Insufficient stock in the selected godown');
        }

        if ($existing) {
            $existing->update(['quantity' => $newQuantity]);
        } else {
            ProductStock::create([
                'business_id' => $params['businessId'],
                'product_id' => $params['productId'],
                'godown_id' => $params['godownId'],
                'batch_id' => $params['batchId'],
                'quantity' => $newQuantity,
            ]);
        }

        StockMovement::create([
            'business_id' => $params['businessId'],
            'product_id' => $params['productId'],
            'godown_id' => $params['godownId'],
            'batch_id' => $params['batchId'],
            'quantity' => $params['quantityDelta'],
            'source_type' => $params['sourceType'],
            'source_id' => $params['sourceId'] ?? null,
            'notes' => $params['notes'] ?? null,
        ]);

        Product::where('id', $params['productId'])->increment('current_stock', $params['quantityDelta']);
    }

    /** Adds stock that already exists in inventory terms (opening stock, sales returns, manual adjustments). */
    public function receiveExisting(array $params): void
    {
        $this->adjustStock([
            'businessId' => $params['businessId'],
            'productId' => $params['productId'],
            'godownId' => $params['godownId'],
            'batchId' => $params['batchId'],
            'quantityDelta' => $params['quantity'],
            'sourceType' => $params['sourceType'],
            'sourceId' => $params['sourceId'] ?? null,
        ]);
    }

    /** Receives stock into a godown (purchase, or a manual adjustment). Creates the batch if needed. */
    public function receive(array $params): array
    {
        $batchId = null;
        if (! empty($params['batchInfo'])) {
            $batch = $this->findOrCreateBatch($params['businessId'], $params['productId'], $params['batchInfo']);
            $batchId = $batch->id;
        }

        $this->adjustStock([
            'businessId' => $params['businessId'],
            'productId' => $params['productId'],
            'godownId' => $params['godownId'],
            'batchId' => $batchId,
            'quantityDelta' => $params['quantity'],
            'sourceType' => $params['sourceType'],
            'sourceId' => $params['sourceId'] ?? null,
        ]);

        return ['batchId' => $batchId];
    }

    /** Removes stock from a specific godown+batch (purchase return, transfer-out, manual adjustment). */
    public function remove(array $params): void
    {
        $this->adjustStock([
            'businessId' => $params['businessId'],
            'productId' => $params['productId'],
            'godownId' => $params['godownId'],
            'batchId' => $params['batchId'],
            'quantityDelta' => -$params['quantity'],
            'sourceType' => $params['sourceType'],
            'sourceId' => $params['sourceId'] ?? null,
        ]);
    }

    /** Consumes stock for a non-batch-tracked product from a single godown. */
    public function consumeSimple(array $params): void
    {
        $this->adjustStock([
            'businessId' => $params['businessId'],
            'productId' => $params['productId'],
            'godownId' => $params['godownId'],
            'batchId' => null,
            'quantityDelta' => -$params['quantity'],
            'sourceType' => $params['sourceType'],
            'sourceId' => $params['sourceId'] ?? null,
        ]);
    }

    /**
     * Consumes stock for a batch-tracked product using FEFO (first-expiring-first-out),
     * splitting across batches if needed. Throws if the godown doesn't have enough total stock.
     *
     * @return array<int, array{batchId: string, batchNumber: string, quantity: float}>
     */
    public function consumeFefo(array $params): array
    {
        $stocks = ProductStock::where('product_id', $params['productId'])
            ->where('godown_id', $params['godownId'])
            ->whereNotNull('batch_id')
            ->where('quantity', '>', 0)
            ->with('batch')
            ->get()
            ->sort(function (ProductStock $a, ProductStock $b) {
                $aExpiry = $a->batch?->expiry_date?->timestamp ?? PHP_INT_MAX;
                $bExpiry = $b->batch?->expiry_date?->timestamp ?? PHP_INT_MAX;
                if ($aExpiry !== $bExpiry) {
                    return $aExpiry <=> $bExpiry;
                }

                return ($a->batch?->created_at?->timestamp ?? 0) <=> ($b->batch?->created_at?->timestamp ?? 0);
            })
            ->values();

        $remaining = $params['quantity'];
        $consumed = [];

        foreach ($stocks as $stock) {
            if ($remaining <= 0) {
                break;
            }
            $available = (float) $stock->quantity;
            $take = min($available, $remaining);
            if ($take <= 0 || ! $stock->batch) {
                continue;
            }

            $this->adjustStock([
                'businessId' => $params['businessId'],
                'productId' => $params['productId'],
                'godownId' => $params['godownId'],
                'batchId' => $stock->batch_id,
                'quantityDelta' => -$take,
                'sourceType' => $params['sourceType'],
                'sourceId' => $params['sourceId'] ?? null,
            ]);

            $consumed[] = [
                'batchId' => $stock->batch_id,
                'batchNumber' => $stock->batch->batch_number,
                'quantity' => $take,
            ];
            $remaining -= $take;
        }

        if ($remaining > 0) {
            throw new HttpException(400, 'Insufficient batch stock in the selected godown for this product');
        }

        return $consumed;
    }
}
