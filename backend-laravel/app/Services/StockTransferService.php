<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Godown;
use App\Models\Product;
use App\Models\StockTransfer;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StockTransferService
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly AuditService $auditService,
    ) {}

    public function findAll(string $businessId)
    {
        return StockTransfer::with([
            'product:id,name,unit',
            'batch:id,batch_number',
            'fromGodown:id,name',
            'toGodown:id,name',
        ])
            ->where('business_id', $businessId)
            ->orderByDesc('transfer_date')
            ->get();
    }

    public function create(string $businessId, array $data, array $actor): StockTransfer
    {
        if ($data['fromGodownId'] === $data['toGodownId']) {
            throw new HttpException(400, 'Source and destination godowns must be different');
        }

        $product = Product::where('id', $data['productId'])->where('business_id', $businessId)->first();
        if (! $product) {
            throw new HttpException(404, 'Product not found');
        }
        $fromGodown = Godown::where('id', $data['fromGodownId'])->where('business_id', $businessId)->first();
        if (! $fromGodown) {
            throw new HttpException(404, 'Source godown not found');
        }
        $toGodown = Godown::where('id', $data['toGodownId'])->where('business_id', $businessId)->first();
        if (! $toGodown) {
            throw new HttpException(404, 'Destination godown not found');
        }

        if ($product->tracks_batches && empty($data['batchId'])) {
            throw new HttpException(400, 'This product tracks batches — select a batch to transfer');
        }
        if (! empty($data['batchId'])) {
            $batch = Batch::where('id', $data['batchId'])->where('business_id', $businessId)->where('product_id', $data['productId'])->first();
            if (! $batch) {
                throw new HttpException(404, 'Batch not found for this product');
            }
        }

        return DB::transaction(function () use ($businessId, $data, $product, $fromGodown, $toGodown, $actor) {
            $transfer = StockTransfer::create([
                'business_id' => $businessId,
                'product_id' => $data['productId'],
                'batch_id' => $data['batchId'] ?? null,
                'from_godown_id' => $data['fromGodownId'],
                'to_godown_id' => $data['toGodownId'],
                'quantity' => $data['quantity'],
                'notes' => $data['notes'] ?? null,
            ]);

            $this->stockService->remove([
                'businessId' => $businessId,
                'productId' => $data['productId'],
                'godownId' => $data['fromGodownId'],
                'batchId' => $data['batchId'] ?? null,
                'quantity' => $data['quantity'],
                'sourceType' => 'TRANSFER_OUT',
                'sourceId' => $transfer->id,
            ]);
            $this->stockService->receiveExisting([
                'businessId' => $businessId,
                'productId' => $data['productId'],
                'godownId' => $data['toGodownId'],
                'batchId' => $data['batchId'] ?? null,
                'quantity' => $data['quantity'],
                'sourceType' => 'TRANSFER_IN',
                'sourceId' => $transfer->id,
            ]);

            $this->auditService->log([
                'businessId' => $businessId,
                'userId' => $actor['userId'],
                'userEmail' => $actor['userEmail'],
                'entityType' => 'StockTransfer',
                'entityId' => $transfer->id,
                'action' => 'CREATE',
                'summary' => "Transferred {$data['quantity']} {$product->unit} of \"{$product->name}\" from {$fromGodown->name} to {$toGodown->name}",
                'changes' => ['after' => $transfer->toArray()],
            ]);

            return $transfer->fresh(['product:id,name,unit', 'batch:id,batch_number', 'fromGodown:id,name', 'toGodown:id,name']);
        });
    }
}
