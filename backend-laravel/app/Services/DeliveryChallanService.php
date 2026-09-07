<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryChallan;
use App\Models\Product;
use App\Models\SalesInvoice;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeliveryChallanService
{
    public function __construct(
        private readonly BranchService $branchService,
        private readonly AuditService $auditService,
    ) {}

    public function findAll(string $businessId, ?string $branchId = null)
    {
        return DeliveryChallan::with(['customer', 'branch', 'salesInvoice:id,invoice_number'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): DeliveryChallan
    {
        $challan = DeliveryChallan::with(['customer', 'branch', 'items', 'salesInvoice:id,invoice_number'])
            ->where('business_id', $businessId)->find($id);

        if (! $challan) {
            throw new HttpException(404, 'Delivery challan not found');
        }

        return $challan;
    }

    public function create(string $businessId, array $data, array $actor): DeliveryChallan
    {
        $customer = Customer::where('id', $data['customerId'])->where('business_id', $businessId)->first();
        if (! $customer) {
            throw new HttpException(400, 'Customer not found');
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

        if (! empty($data['salesInvoiceId'])) {
            $invoice = SalesInvoice::where('id', $data['salesInvoiceId'])->where('business_id', $businessId)->first();
            if (! $invoice) {
                throw new HttpException(400, 'Sales invoice not found');
            }
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
            $unitPrice = $item['unitPrice'] ?? (float) $product->selling_price;

            return [
                'productId' => $product->id,
                'productName' => $product->name,
                'quantity' => $item['quantity'],
                'unitPrice' => $unitPrice,
                'lineTotal' => $unitPrice * $item['quantity'],
            ];
        }, $data['items']);

        $challanCount = DeliveryChallan::where('business_id', $businessId)->count();
        $challanNumber = 'DC-'.str_pad((string) ($challanCount + 1), 6, '0', STR_PAD_LEFT);

        $challan = DeliveryChallan::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'customer_id' => $data['customerId'],
            'sales_invoice_id' => $data['salesInvoiceId'] ?? null,
            'challan_number' => $challanNumber,
            'vehicle_number' => $data['vehicleNumber'] ?? null,
            'transporter_name' => $data['transporterName'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);

        foreach ($lineItems as $li) {
            $challan->items()->create([
                'product_id' => $li['productId'],
                'product_name' => $li['productName'],
                'quantity' => $li['quantity'],
                'unit_price' => $li['unitPrice'],
                'line_total' => $li['lineTotal'],
            ]);
        }

        $challan = $challan->fresh(['items', 'customer', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'DeliveryChallan',
            'entityId' => $challan->id,
            'action' => 'CREATE',
            'summary' => "Created delivery challan {$challanNumber}",
            'changes' => ['after' => $challan->toArray()],
        ]);

        return $challan;
    }

    public function updateStatus(string $businessId, string $id, string $status, array $actor): DeliveryChallan
    {
        $challan = $this->findOne($businessId, $id);

        $before = $challan->status;
        $challan->status = $status;
        $challan->save();
        $challan->load(['items', 'customer', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'DeliveryChallan',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Marked delivery challan {$challan->challan_number} as {$status}",
            'changes' => ['before' => ['status' => $before], 'after' => ['status' => $status]],
        ]);

        return $challan;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $challan = $this->findOne($businessId, $id);

        $before = $challan->toArray();
        $challan->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'DeliveryChallan',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted delivery challan {$challan->challan_number}",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }
}
