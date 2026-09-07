<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Quotation;
use Symfony\Component\HttpKernel\Exception\HttpException;

class QuotationService
{
    public function __construct(
        private readonly BranchService $branchService,
        private readonly SalesService $salesService,
        private readonly AuditService $auditService,
    ) {}

    public function findAll(string $businessId, ?string $branchId = null)
    {
        return Quotation::with(['customer', 'branch'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Quotation
    {
        $quotation = Quotation::with(['customer', 'branch', 'items', 'convertedInvoice:id,invoice_number'])
            ->where('business_id', $businessId)->find($id);

        if (! $quotation) {
            throw new HttpException(404, 'Quotation not found');
        }

        return $quotation;
    }

    public function create(string $businessId, array $data, array $actor): Quotation
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

        $quotationCount = Quotation::where('business_id', $businessId)->count();
        $quotationNumber = 'QTN-'.str_pad((string) ($quotationCount + 1), 6, '0', STR_PAD_LEFT);

        $quotation = Quotation::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'customer_id' => $data['customerId'],
            'quotation_number' => $quotationNumber,
            'valid_until' => $data['validUntil'] ?? null,
            'notes' => $data['notes'] ?? null,
            'subtotal' => $subtotal,
            'tax_total' => $taxTotal,
            'discount_total' => $discountTotal,
            'grand_total' => $grandTotal,
        ]);

        foreach ($lineItems as $li) {
            $quotation->items()->create([
                'product_id' => $li['productId'],
                'product_name' => $li['productName'],
                'quantity' => $li['quantity'],
                'unit_price' => $li['unitPrice'],
                'gst_rate' => $li['gstRate'],
                'tax_amount' => $li['taxAmount'],
                'line_total' => $li['lineTotal'],
            ]);
        }

        $quotation = $quotation->fresh(['items', 'customer', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Quotation',
            'entityId' => $quotation->id,
            'action' => 'CREATE',
            'summary' => "Created quotation {$quotationNumber} for ₹".number_format($grandTotal, 2),
            'changes' => ['after' => $quotation->toArray()],
        ]);

        return $quotation;
    }

    public function updateStatus(string $businessId, string $id, string $status, array $actor): Quotation
    {
        $quotation = $this->findOne($businessId, $id);

        if ($quotation->status === 'CONVERTED') {
            throw new HttpException(400, 'This quotation has already been converted to an invoice');
        }

        $before = $quotation->status;
        $quotation->status = $status;
        $quotation->save();
        $quotation->load(['items', 'customer', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Quotation',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Marked quotation {$quotation->quotation_number} as {$status}",
            'changes' => ['before' => ['status' => $before], 'after' => ['status' => $status]],
        ]);

        return $quotation;
    }

    public function convertToInvoice(string $businessId, string $id, array $actor): array
    {
        $quotation = $this->findOne($businessId, $id);

        if ($quotation->status === 'CONVERTED') {
            throw new HttpException(400, 'This quotation has already been converted to an invoice');
        }
        if (in_array($quotation->status, ['REJECTED', 'EXPIRED'], true)) {
            throw new HttpException(400, 'Cannot convert a '.strtolower($quotation->status).' quotation');
        }

        $invoice = $this->salesService->create($businessId, [
            'customerId' => $quotation->customer_id,
            'branchId' => $quotation->branch_id,
            'discountTotal' => (float) $quotation->discount_total,
            'items' => $quotation->items->map(fn ($item) => [
                'productId' => $item->product_id,
                'quantity' => (float) $item->quantity,
                'unitPrice' => (float) $item->unit_price,
            ])->all(),
        ], $actor);

        $quotation->status = 'CONVERTED';
        $quotation->converted_invoice_id = $invoice->id;
        $quotation->save();
        $quotation->load(['items', 'customer', 'branch']);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Quotation',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Converted quotation {$quotation->quotation_number} to invoice {$invoice->invoice_number}",
            'changes' => ['after' => ['invoiceId' => $invoice->id, 'invoiceNumber' => $invoice->invoice_number]],
        ]);

        return ['quotation' => $quotation, 'invoice' => $invoice];
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $quotation = $this->findOne($businessId, $id);

        if ($quotation->status === 'CONVERTED') {
            throw new HttpException(400, 'Cannot delete a converted quotation');
        }

        $before = $quotation->toArray();
        $quotation->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Quotation',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted quotation {$quotation->quotation_number}",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }
}
