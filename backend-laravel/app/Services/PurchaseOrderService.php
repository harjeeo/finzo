<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Supplier;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PurchaseOrderService
{
    public function __construct(
        private readonly BranchService $branchService,
        private readonly PurchaseService $purchaseService,
        private readonly AuditService $auditService,
    ) {}

    public function findAll(string $businessId, ?string $branchId = null)
    {
        return PurchaseOrder::with(['supplier', 'branch'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): PurchaseOrder
    {
        $po = PurchaseOrder::with(['supplier', 'branch', 'items', 'convertedBill:id,bill_number'])
            ->where('business_id', $businessId)->find($id);

        if (! $po) {
            throw new HttpException(404, 'Purchase order not found');
        }

        return $po;
    }

    public function create(string $businessId, array $data, array $actor): PurchaseOrder
    {
        $supplier = Supplier::where('id', $data['supplierId'])->where('business_id', $businessId)->first();
        if (! $supplier) {
            throw new HttpException(400, 'Supplier not found');
        }

        if (! empty($data['branchId'])) {
            $branch = Branch::where('id', $data['branchId'])->where('business_id', $businessId)->first();
            if (! $branch) {
                throw new HttpException(400, 'Branch not found');
            }
            $branchId = $branch->id;
        } else {
            $branchId = $this->branchService->getOrCreateDefaultBranch($businessId)->id;
        }

        $productIds = array_column($data['items'], 'productId');
        $products = Product::whereIn('id', $productIds)->where('business_id', $businessId)->get()->keyBy('id');

        foreach ($data['items'] as $item) {
            if (! $products->has($item['productId'])) {
                throw new HttpException(400, "Product {$item['productId']} not found");
            }
        }

        $lineItems = array_map(function (array $item) use ($products) {
            $product = $products->get($item['productId']);
            $unitPrice = $item['unitPrice'] ?? (float) $product->purchase_price;
            $gstRate = (float) $product->gst_rate;
            $lineSubtotal = $unitPrice * $item['quantity'];
            $taxAmount = round($lineSubtotal * ($gstRate / 100), 2);
            $lineTotal = $lineSubtotal + $taxAmount;

            return [
                'productId' => $product->id,
                'productName' => $product->name,
                'quantity' => $item['quantity'],
                'unitPrice' => $unitPrice,
                'gstRate' => $gstRate,
                'taxAmount' => $taxAmount,
                'lineTotal' => $lineTotal,
                'lineSubtotal' => $lineSubtotal,
            ];
        }, $data['items']);

        $subtotal = array_sum(array_column($lineItems, 'lineSubtotal'));
        $taxTotal = array_sum(array_column($lineItems, 'taxAmount'));
        $discountTotal = $data['discountTotal'] ?? 0;
        $grandTotal = $subtotal + $taxTotal - $discountTotal;

        $poCount = PurchaseOrder::where('business_id', $businessId)->count();
        $poNumber = 'PO-'.str_pad((string) ($poCount + 1), 6, '0', STR_PAD_LEFT);

        $po = PurchaseOrder::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'supplier_id' => $data['supplierId'],
            'po_number' => $poNumber,
            'expected_date' => $data['expectedDate'] ?? null,
            'notes' => $data['notes'] ?? null,
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'discount_total' => $discountTotal,
            'grand_total' => $grandTotal,
        ]);

        foreach ($lineItems as $li) {
            $po->items()->create([
                'product_id' => $li['productId'],
                'product_name' => $li['productName'],
                'quantity' => $li['quantity'],
                'unit_price' => $li['unitPrice'],
                'gst_rate' => $li['gstRate'],
                'tax_amount' => $li['taxAmount'],
                'line_total' => $li['lineTotal'],
            ]);
        }

        $po = $po->fresh(['items', 'supplier', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PurchaseOrder',
            'entityId' => $po->id,
            'action' => 'CREATE',
            'summary' => "Created purchase order {$poNumber} for ₹".number_format($grandTotal, 2),
            'changes' => ['after' => $po->toArray()],
        ]);

        return $po;
    }

    public function updateStatus(string $businessId, string $id, string $status, array $actor): PurchaseOrder
    {
        $po = $this->findOne($businessId, $id);

        if ($po->status === 'CONVERTED') {
            throw new HttpException(400, 'This purchase order has already been converted to a bill');
        }

        $before = $po->status;
        $po->status = $status;
        $po->save();
        $po->load(['items', 'supplier', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PurchaseOrder',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Marked purchase order {$po->po_number} as {$status}",
            'changes' => ['before' => ['status' => $before], 'after' => ['status' => $status]],
        ]);

        return $po;
    }

    public function convertToBill(string $businessId, string $id, array $actor): array
    {
        $po = $this->findOne($businessId, $id);

        if ($po->status === 'CONVERTED') {
            throw new HttpException(400, 'This purchase order has already been converted to a bill');
        }
        if ($po->status === 'CANCELLED') {
            throw new HttpException(400, 'Cannot convert a cancelled purchase order');
        }

        $bill = $this->purchaseService->create($businessId, [
            'supplierId' => $po->supplier_id,
            'branchId' => $po->branch_id,
            'discountTotal' => (float) $po->discount_total,
            'items' => $po->items->map(fn ($item) => [
                'productId' => $item->product_id,
                'quantity' => (float) $item->quantity,
                'unitPrice' => (float) $item->unit_price,
            ])->all(),
        ], $actor);

        $po->status = 'CONVERTED';
        $po->converted_bill_id = $bill->id;
        $po->save();
        $po->load(['items', 'supplier', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PurchaseOrder',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Converted purchase order {$po->po_number} to bill {$bill->bill_number}",
            'changes' => ['after' => ['billId' => $bill->id, 'billNumber' => $bill->bill_number]],
        ]);

        return ['purchaseOrder' => $po, 'bill' => $bill];
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $po = $this->findOne($businessId, $id);

        if ($po->status === 'CONVERTED') {
            throw new HttpException(400, 'Cannot delete a converted purchase order');
        }

        $before = $po->toArray();
        $po->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PurchaseOrder',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted purchase order {$po->po_number}",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }
}
