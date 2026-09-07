<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Branch;
use App\Models\Godown;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\PurchaseBill;
use App\Models\PurchasePayment;
use App\Models\PurchaseReturn;
use App\Models\Supplier;
use App\Support\SystemAccountCodes;
use App\Support\UnitConversion;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PurchaseService
{
    public function __construct(
        private readonly BranchService $branchService,
        private readonly GodownService $godownService,
        private readonly StockService $stockService,
        private readonly AccountsService $accountsService,
        private readonly JournalService $journalService,
        private readonly AuditService $auditService,
    ) {}

    public function findAll(string $businessId, ?string $branchId = null)
    {
        return PurchaseBill::with(['supplier', 'branch'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): PurchaseBill
    {
        $bill = PurchaseBill::with([
            'supplier',
            'branch',
            'items',
            'payments' => fn ($q) => $q->orderByDesc('payment_date'),
            'returns' => fn ($q) => $q->orderByDesc('return_date'),
            'returns.items',
        ])->where('business_id', $businessId)->find($id);

        if (! $bill) {
            throw new HttpException(404, 'Purchase bill not found');
        }

        return $bill;
    }

    /** Falls back to the bill's branch default godown for bills created before godown tracking existed. */
    private function resolveBillGodownId(string $businessId, PurchaseBill $bill): string
    {
        if ($bill->godown_id) {
            return $bill->godown_id;
        }
        $branchId = $bill->branch_id ?? $this->branchService->getOrCreateDefaultBranch($businessId)->id;

        return $this->godownService->getOrCreateDefaultGodown($businessId, $branchId)->id;
    }

    public function create(string $businessId, array $data, array $actor): PurchaseBill
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

        if (! empty($data['godownId'])) {
            $godown = Godown::where('id', $data['godownId'])->where('business_id', $businessId)->where('branch_id', $branchId)->first();
            if (! $godown) {
                throw new HttpException(400, 'Godown not found for this branch');
            }
            $godownId = $godown->id;
        } else {
            $godownId = $this->godownService->getOrCreateDefaultGodown($businessId, $branchId)->id;
        }

        $productIds = array_column($data['items'], 'productId');
        $products = Product::whereIn('id', $productIds)->where('business_id', $businessId)->get()->keyBy('id');

        foreach ($data['items'] as $item) {
            $product = $products->get($item['productId']);
            if (! $product) {
                throw new HttpException(400, "Product {$item['productId']} not found");
            }
            if ($product->tracks_batches && empty($item['batchNumber'])) {
                throw new HttpException(400, "\"{$product->name}\" tracks batches — a batch number is required");
            }
        }

        $productUnits = ProductUnit::whereIn('product_id', $productIds)->get();

        $lineItems = array_map(function (array $item) use ($products, $productUnits) {
            $product = $products->get($item['productId']);
            $unitPrice = $item['unitPrice'] ?? (float) $product->purchase_price;
            $gstRate = (float) $product->gst_rate;
            $lineSubtotal = $unitPrice * $item['quantity'];
            $taxAmount = round($lineSubtotal * ($gstRate / 100), 2);
            $lineTotal = $lineSubtotal + $taxAmount;
            $conversion = UnitConversion::resolve(
                $product->id,
                $product->name,
                $product->unit,
                $item['unit'] ?? null,
                $productUnits,
            );

            return [
                'productId' => $product->id,
                'productName' => $product->name,
                'quantity' => $item['quantity'],
                'unitPrice' => $unitPrice,
                'unit' => $conversion['unit'],
                'unitConversionFactor' => $conversion['conversionFactor'],
                'gstRate' => $gstRate,
                'taxAmount' => $taxAmount,
                'lineTotal' => $lineTotal,
                'lineSubtotal' => $lineSubtotal,
                'batchNumber' => $item['batchNumber'] ?? null,
                'manufactureDate' => $item['manufactureDate'] ?? null,
                'expiryDate' => $item['expiryDate'] ?? null,
            ];
        }, $data['items']);

        $subtotal = array_sum(array_column($lineItems, 'lineSubtotal'));
        $taxTotal = array_sum(array_column($lineItems, 'taxAmount'));
        $discountTotal = $data['discountTotal'] ?? 0;
        $grandTotal = $subtotal + $taxTotal - $discountTotal;

        $billCount = PurchaseBill::where('business_id', $businessId)->count();
        $billNumber = 'PUR-'.str_pad((string) ($billCount + 1), 6, '0', STR_PAD_LEFT);

        $bill = DB::transaction(function () use (
            $businessId, $branchId, $godownId, $data, $lineItems,
            $subtotal, $taxTotal, $discountTotal, $grandTotal, $billNumber,
        ) {
            $bill = PurchaseBill::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'godown_id' => $godownId,
                'supplier_id' => $data['supplierId'],
                'bill_number' => $billNumber,
                'status' => 'UNPAID',
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'grand_total' => $grandTotal,
            ]);

            foreach ($lineItems as $li) {
                $bill->items()->create([
                    'product_id' => $li['productId'],
                    'product_name' => $li['productName'],
                    'quantity' => $li['quantity'],
                    'unit_price' => $li['unitPrice'],
                    'unit' => $li['unit'],
                    'unit_conversion_factor' => $li['unitConversionFactor'],
                    'gst_rate' => $li['gstRate'],
                    'tax_amount' => $li['taxAmount'],
                    'line_total' => $li['lineTotal'],
                    'batch_number' => $li['batchNumber'],
                    'manufacture_date' => $li['manufactureDate'],
                    'expiry_date' => $li['expiryDate'],
                ]);
            }

            foreach ($lineItems as $item) {
                $this->stockService->receive([
                    'businessId' => $businessId,
                    'productId' => $item['productId'],
                    'godownId' => $godownId,
                    'quantity' => $item['quantity'] * $item['unitConversionFactor'],
                    'batchInfo' => $item['batchNumber'] ? [
                        'batchNumber' => $item['batchNumber'],
                        'manufactureDate' => $item['manufactureDate'],
                        'expiryDate' => $item['expiryDate'],
                    ] : null,
                    'sourceType' => 'PURCHASE',
                    'sourceId' => $bill->id,
                ]);
            }

            $purchasesAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::PURCHASES);
            $gstInputAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::GST_INPUT);
            $apAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::ACCOUNTS_PAYABLE);

            $lines = [
                ['accountId' => $purchasesAccount->id, 'debit' => $subtotal - $discountTotal],
                ['accountId' => $apAccount->id, 'credit' => $grandTotal],
            ];
            if ($taxTotal > 0) {
                $lines[] = ['accountId' => $gstInputAccount->id, 'debit' => $taxTotal];
            }
            $this->journalService->postEntry($businessId, [
                'sourceType' => 'PURCHASE_BILL',
                'sourceId' => $bill->id,
                'narration' => "Purchase bill {$billNumber}",
                'lines' => $lines,
            ]);

            return $bill->fresh(['items', 'supplier', 'branch', 'godown']);
        });

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'PurchaseBill',
            'entityId' => $bill->id,
            'action' => 'CREATE',
            'summary' => "Created purchase bill {$billNumber} for ₹".number_format($grandTotal, 2),
            'changes' => ['after' => $bill->toArray()],
        ]);

        return $bill;
    }

    public function addPayment(string $businessId, string $id, array $data): PurchaseBill
    {
        $bill = $this->findOne($businessId, $id);

        if ($bill->status === 'CANCELLED') {
            throw new HttpException(400, 'Cannot record a payment on a cancelled bill');
        }

        $balanceDue = (float) $bill->grand_total - (float) $bill->amount_paid;
        if ($data['amount'] > $balanceDue) {
            throw new HttpException(400, 'Payment amount exceeds balance due (₹'.number_format($balanceDue, 2).')');
        }

        $newAmountPaid = (float) $bill->amount_paid + $data['amount'];
        $newStatus = $newAmountPaid >= (float) $bill->grand_total ? 'PAID' : 'PARTIALLY_PAID';

        return DB::transaction(function () use ($businessId, $id, $data, $bill, $newAmountPaid, $newStatus) {
            $payment = PurchasePayment::create([
                'purchase_bill_id' => $id,
                'amount' => $data['amount'],
                'payment_mode' => $data['paymentMode'] ?? 'CASH',
                'reference' => $data['reference'] ?? null,
                'payment_date' => $data['paymentDate'] ?? now(),
            ]);

            $apAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::ACCOUNTS_PAYABLE);
            $cashOrBankAccount = $this->accountsService->getSystemAccount(
                $businessId,
                SystemAccountCodes::paymentModeAccountCode($data['paymentMode'] ?? null),
            );

            $this->journalService->postEntry($businessId, [
                'sourceType' => 'PURCHASE_PAYMENT',
                'sourceId' => $payment->id,
                'narration' => "Payment made for bill {$bill->bill_number}",
                'lines' => [
                    ['accountId' => $apAccount->id, 'debit' => $data['amount']],
                    ['accountId' => $cashOrBankAccount->id, 'credit' => $data['amount']],
                ],
            ]);

            $bill->update(['amount_paid' => $newAmountPaid, 'status' => $newStatus]);

            return $bill->fresh([
                'supplier', 'items',
                'payments' => fn ($q) => $q->orderByDesc('payment_date'),
                'returns' => fn ($q) => $q->orderByDesc('return_date'),
                'returns.items',
            ]);
        });
    }

    public function createReturn(string $businessId, string $id, array $data): PurchaseReturn
    {
        $bill = $this->findOne($businessId, $id);

        if ($bill->status === 'CANCELLED') {
            throw new HttpException(400, 'Cannot return items on a cancelled bill');
        }

        $billItemMap = [];
        foreach ($bill->items as $item) {
            $billItemMap[$item->product_id] = $item;
        }

        $alreadyReturned = [];
        foreach ($bill->returns as $ret) {
            foreach ($ret->items as $item) {
                $alreadyReturned[$item->product_id] = ($alreadyReturned[$item->product_id] ?? 0) + (float) $item->quantity;
            }
        }

        foreach ($data['items'] as $item) {
            $billItem = $billItemMap[$item['productId']] ?? null;
            if (! $billItem) {
                throw new HttpException(400, "Product {$item['productId']} was not part of this bill");
            }
            $returnedSoFar = $alreadyReturned[$item['productId']] ?? 0;
            $maxReturnable = (float) $billItem->quantity - $returnedSoFar;
            if ($item['quantity'] > $maxReturnable) {
                throw new HttpException(400, "Cannot return {$item['quantity']} of \"{$billItem->product_name}\" (max returnable: {$maxReturnable})");
            }
        }

        foreach ($data['items'] as $item) {
            $product = Product::findOrFail($item['productId']);
            $billItem = $billItemMap[$item['productId']];
            $baseQuantity = $item['quantity'] * (float) $billItem->unit_conversion_factor;
            if ((float) $product->current_stock < $baseQuantity) {
                throw new HttpException(400, "Insufficient stock for \"{$product->name}\" to return (available: {$product->current_stock})");
            }
        }

        $lineItems = array_map(function (array $item) use ($billItemMap) {
            $billItem = $billItemMap[$item['productId']];
            $unitPrice = (float) $billItem->unit_price;
            $gstRate = (float) $billItem->gst_rate;
            $lineSubtotal = $unitPrice * $item['quantity'];
            $taxAmount = round($lineSubtotal * ($gstRate / 100), 2);
            $lineTotal = $lineSubtotal + $taxAmount;

            return [
                'productId' => $billItem->product_id,
                'productName' => $billItem->product_name,
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
        $grandTotal = $subtotal + $taxTotal;

        $returnCount = PurchaseReturn::where('business_id', $businessId)->count();
        $returnNumber = 'DN-'.str_pad((string) ($returnCount + 1), 6, '0', STR_PAD_LEFT);

        return DB::transaction(function () use (
            $businessId, $id, $bill, $data, $billItemMap, $lineItems,
            $subtotal, $taxTotal, $grandTotal, $returnNumber,
        ) {
            $purchaseReturn = PurchaseReturn::create([
                'business_id' => $businessId,
                'purchase_bill_id' => $id,
                'supplier_id' => $bill->supplier_id,
                'return_number' => $returnNumber,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
            ]);

            foreach ($lineItems as $li) {
                $purchaseReturn->items()->create([
                    'product_id' => $li['productId'],
                    'product_name' => $li['productName'],
                    'quantity' => $li['quantity'],
                    'unit_price' => $li['unitPrice'],
                    'gst_rate' => $li['gstRate'],
                    'tax_amount' => $li['taxAmount'],
                    'line_total' => $li['lineTotal'],
                ]);
            }

            $returnGodownId = $this->resolveBillGodownId($businessId, $bill);
            foreach ($data['items'] as $item) {
                $billItem = $billItemMap[$item['productId']];
                $batchId = null;
                if ($billItem->batch_number) {
                    $batch = Batch::where('product_id', $item['productId'])
                        ->where('batch_number', $billItem->batch_number)
                        ->first();
                    $batchId = $batch?->id;
                }
                $this->stockService->remove([
                    'businessId' => $businessId,
                    'productId' => $item['productId'],
                    'godownId' => $returnGodownId,
                    'batchId' => $batchId,
                    'quantity' => $item['quantity'] * (float) $billItem->unit_conversion_factor,
                    'sourceType' => 'PURCHASE_RETURN',
                    'sourceId' => $id,
                ]);
            }

            $purchaseReturnsAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::PURCHASE_RETURNS);
            $gstInputAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::GST_INPUT);
            $apAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::ACCOUNTS_PAYABLE);

            $this->journalService->postEntry($businessId, [
                'sourceType' => 'PURCHASE_RETURN',
                'sourceId' => $purchaseReturn->id,
                'narration' => "Purchase return {$purchaseReturn->return_number}",
                'lines' => [
                    ['accountId' => $apAccount->id, 'debit' => $grandTotal],
                    ['accountId' => $purchaseReturnsAccount->id, 'credit' => $subtotal],
                    ['accountId' => $gstInputAccount->id, 'credit' => $taxTotal],
                ],
            ]);

            return $purchaseReturn->fresh('items');
        });
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $bill = $this->findOne($businessId, $id);

        return DB::transaction(function () use ($businessId, $id, $bill, $actor) {
            $godownId = $this->resolveBillGodownId($businessId, $bill);
            foreach ($bill->items as $item) {
                $batchId = null;
                if ($item->batch_number) {
                    $batch = Batch::where('product_id', $item->product_id)
                        ->where('batch_number', $item->batch_number)
                        ->first();
                    $batchId = $batch?->id;
                }
                $this->stockService->remove([
                    'businessId' => $businessId,
                    'productId' => $item->product_id,
                    'godownId' => $godownId,
                    'batchId' => $batchId,
                    'quantity' => (float) $item->quantity * (float) $item->unit_conversion_factor,
                    'sourceType' => 'ADJUSTMENT',
                    'sourceId' => $id,
                ]);
            }

            $sourceIds = array_merge(
                [$id],
                $bill->payments->pluck('id')->all(),
                $bill->returns->pluck('id')->all(),
            );
            \App\Models\JournalEntry::where('business_id', $businessId)->whereIn('source_id', $sourceIds)->delete();

            $before = $bill->toArray();
            $bill->delete();

            $this->auditService->log([
                'businessId' => $businessId,
                'userId' => $actor['userId'],
                'userEmail' => $actor['userEmail'],
                'entityType' => 'PurchaseBill',
                'entityId' => $id,
                'action' => 'DELETE',
                'summary' => "Deleted purchase bill {$bill->bill_number}",
                'changes' => ['before' => $before],
            ]);

            return ['success' => true];
        });
    }
}
