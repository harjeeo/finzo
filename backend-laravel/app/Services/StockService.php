<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Ports the NestJS StockService one method at a time as the modules that need
 * them get ported. Only adjustStock/receiveExisting exist so far (used by
 * Products' openingStock); receive/consumeSimple/consumeFefo/remove land with
 * Purchases/Sales.
 */
class StockService
{
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
}
