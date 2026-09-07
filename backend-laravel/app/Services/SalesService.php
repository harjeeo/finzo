<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Business;
use App\Models\Customer;
use App\Models\Godown;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItemBatch;
use App\Models\SalesPayment;
use App\Models\SalesReturn;
use App\Models\SalesReturnItemBatch;
use App\Support\SystemAccountCodes;
use App\Support\UnitConversion;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SalesService
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
        return SalesInvoice::with(['customer', 'branch'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): SalesInvoice
    {
        $invoice = SalesInvoice::with([
            'customer',
            'branch',
            'godown',
            'items.batches',
            'payments' => fn ($q) => $q->orderByDesc('payment_date'),
            'returns' => fn ($q) => $q->orderByDesc('return_date'),
            'returns.items',
        ])->where('business_id', $businessId)->find($id);

        if (! $invoice) {
            throw new HttpException(404, 'Sales invoice not found');
        }

        return $invoice;
    }

    /** Falls back to the invoice's branch default godown for invoices created before godown tracking existed. */
    private function resolveInvoiceGodownId(string $businessId, SalesInvoice $invoice): string
    {
        if ($invoice->godown_id) {
            return $invoice->godown_id;
        }
        $branchId = $invoice->branch_id ?? $this->branchService->getOrCreateDefaultBranch($businessId)->id;

        return $this->godownService->getOrCreateDefaultGodown($businessId, $branchId)->id;
    }

    public function create(string $businessId, array $data, array $actor): SalesInvoice
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
            if (! $products->has($item['productId'])) {
                throw new HttpException(400, "Product {$item['productId']} not found");
            }
        }

        $productUnits = ProductUnit::whereIn('product_id', $productIds)->get();

        $lineItems = array_map(function (array $item) use ($products, $productUnits) {
            $product = $products->get($item['productId']);
            $unitPrice = $item['unitPrice'] ?? (float) $product->selling_price;
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
            ];
        }, $data['items']);

        $subtotal = array_sum(array_column($lineItems, 'lineSubtotal'));
        $taxTotal = array_sum(array_column($lineItems, 'taxAmount'));
        $discountTotal = $data['discountTotal'] ?? 0;
        $grandTotal = $subtotal + $taxTotal - $discountTotal;
        $amountPaid = min($data['amountPaid'] ?? 0, $grandTotal);
        $status = $amountPaid >= $grandTotal && $grandTotal > 0
            ? 'PAID'
            : ($amountPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID');

        $business = Business::findOrFail($businessId);
        $invoiceCount = SalesInvoice::where('business_id', $businessId)->count();
        $invoiceNumber = $business->invoice_prefix.'-'.str_pad((string) ($invoiceCount + 1), 6, '0', STR_PAD_LEFT);

        $invoice = DB::transaction(function () use (
            $businessId, $branchId, $godownId, $data, $products, $lineItems,
            $subtotal, $taxTotal, $discountTotal, $grandTotal, $amountPaid, $status, $invoiceNumber,
        ) {
            $invoice = SalesInvoice::create([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'godown_id' => $godownId,
                'customer_id' => $data['customerId'],
                'invoice_number' => $invoiceNumber,
                'status' => $status,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'discount_total' => $discountTotal,
                'grand_total' => $grandTotal,
                'amount_paid' => $amountPaid,
                'payment_mode' => $data['paymentMode'] ?? null,
            ]);

            foreach ($lineItems as $li) {
                $invoiceItem = $invoice->items()->create([
                    'product_id' => $li['productId'],
                    'product_name' => $li['productName'],
                    'quantity' => $li['quantity'],
                    'unit_price' => $li['unitPrice'],
                    'unit' => $li['unit'],
                    'unit_conversion_factor' => $li['unitConversionFactor'],
                    'gst_rate' => $li['gstRate'],
                    'tax_amount' => $li['taxAmount'],
                    'line_total' => $li['lineTotal'],
                ]);

                $product = $products->get($li['productId']);
                $quantity = $li['quantity'] * $li['unitConversionFactor'];

                if (! $product->tracks_batches) {
                    $this->stockService->consumeSimple([
                        'businessId' => $businessId,
                        'productId' => $li['productId'],
                        'godownId' => $godownId,
                        'quantity' => $quantity,
                        'sourceType' => 'SALES',
                        'sourceId' => $invoice->id,
                    ]);
                    continue;
                }

                $consumed = $this->stockService->consumeFefo([
                    'businessId' => $businessId,
                    'productId' => $li['productId'],
                    'godownId' => $godownId,
                    'quantity' => $quantity,
                    'sourceType' => 'SALES',
                    'sourceId' => $invoice->id,
                ]);
                foreach ($consumed as $c) {
                    SalesInvoiceItemBatch::create([
                        'sales_invoice_item_id' => $invoiceItem->id,
                        'batch_id' => $c['batchId'],
                        'quantity' => $c['quantity'],
                    ]);
                }
            }

            $salesAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::SALES);
            $gstPayableAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::GST_PAYABLE);
            $arAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::ACCOUNTS_RECEIVABLE);

            $balanceDue = $grandTotal - $amountPaid;
            $lines = [
                ['accountId' => $salesAccount->id, 'credit' => $subtotal - $discountTotal],
                ['accountId' => $gstPayableAccount->id, 'credit' => $taxTotal],
            ];
            if ($balanceDue > 0) {
                $lines[] = ['accountId' => $arAccount->id, 'debit' => $balanceDue];
            }
            if ($amountPaid > 0) {
                $cashOrBankAccount = $this->accountsService->getSystemAccount(
                    $businessId,
                    SystemAccountCodes::paymentModeAccountCode($data['paymentMode'] ?? null),
                );
                $lines[] = ['accountId' => $cashOrBankAccount->id, 'debit' => $amountPaid];
            }
            $this->journalService->postEntry($businessId, [
                'sourceType' => 'SALES_INVOICE',
                'sourceId' => $invoice->id,
                'narration' => "Sales invoice {$invoiceNumber}",
                'lines' => $lines,
            ]);

            return $invoice->fresh(['items', 'customer', 'branch', 'godown']);
        });

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'SalesInvoice',
            'entityId' => $invoice->id,
            'action' => 'CREATE',
            'summary' => "Created sales invoice {$invoiceNumber} for ₹".number_format($grandTotal, 2),
            'changes' => ['after' => $invoice->toArray()],
        ]);

        return $invoice;
    }

    public function addPayment(string $businessId, string $id, array $data): SalesInvoice
    {
        $invoice = $this->findOne($businessId, $id);

        if ($invoice->status === 'CANCELLED') {
            throw new HttpException(400, 'Cannot record a payment on a cancelled invoice');
        }

        $balanceDue = (float) $invoice->grand_total - (float) $invoice->amount_paid;
        if ($data['amount'] > $balanceDue) {
            throw new HttpException(400, 'Payment amount exceeds balance due (₹'.number_format($balanceDue, 2).')');
        }

        $newAmountPaid = (float) $invoice->amount_paid + $data['amount'];
        $newStatus = $newAmountPaid >= (float) $invoice->grand_total ? 'PAID' : 'PARTIALLY_PAID';

        return DB::transaction(function () use ($businessId, $id, $data, $invoice, $newAmountPaid, $newStatus) {
            $payment = SalesPayment::create([
                'sales_invoice_id' => $id,
                'amount' => $data['amount'],
                'payment_mode' => $data['paymentMode'] ?? 'CASH',
                'reference' => $data['reference'] ?? null,
                'payment_date' => $data['paymentDate'] ?? now(),
            ]);

            $cashOrBankAccount = $this->accountsService->getSystemAccount(
                $businessId,
                SystemAccountCodes::paymentModeAccountCode($data['paymentMode'] ?? null),
            );
            $arAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::ACCOUNTS_RECEIVABLE);

            $this->journalService->postEntry($businessId, [
                'sourceType' => 'SALES_PAYMENT',
                'sourceId' => $payment->id,
                'narration' => "Payment received for invoice {$invoice->invoice_number}",
                'lines' => [
                    ['accountId' => $cashOrBankAccount->id, 'debit' => $data['amount']],
                    ['accountId' => $arAccount->id, 'credit' => $data['amount']],
                ],
            ]);

            $invoice->update(['amount_paid' => $newAmountPaid, 'status' => $newStatus]);

            return $invoice->fresh([
                'customer', 'items',
                'payments' => fn ($q) => $q->orderByDesc('payment_date'),
                'returns' => fn ($q) => $q->orderByDesc('return_date'),
                'returns.items',
            ]);
        });
    }

    public function createReturn(string $businessId, string $id, array $data): SalesReturn
    {
        $invoice = $this->findOne($businessId, $id);

        if ($invoice->status === 'CANCELLED') {
            throw new HttpException(400, 'Cannot return items on a cancelled invoice');
        }

        $invoiceItemMap = [];
        foreach ($invoice->items as $item) {
            $invoiceItemMap[$item->product_id] = $item;
        }

        $alreadyReturned = [];
        foreach ($invoice->returns as $ret) {
            foreach ($ret->items as $item) {
                $alreadyReturned[$item->product_id] = ($alreadyReturned[$item->product_id] ?? 0) + (float) $item->quantity;
            }
        }

        foreach ($data['items'] as $item) {
            $invoiceItem = $invoiceItemMap[$item['productId']] ?? null;
            if (! $invoiceItem) {
                throw new HttpException(400, "Product {$item['productId']} was not part of this invoice");
            }
            $returnedSoFar = $alreadyReturned[$item['productId']] ?? 0;
            $maxReturnable = (float) $invoiceItem->quantity - $returnedSoFar;
            if ($item['quantity'] > $maxReturnable) {
                throw new HttpException(400, "Cannot return {$item['quantity']} of \"{$invoiceItem->product_name}\" (max returnable: {$maxReturnable})");
            }
        }

        $lineItems = array_map(function (array $item) use ($invoiceItemMap) {
            $invoiceItem = $invoiceItemMap[$item['productId']];
            $unitPrice = (float) $invoiceItem->unit_price;
            $gstRate = (float) $invoiceItem->gst_rate;
            $lineSubtotal = $unitPrice * $item['quantity'];
            $taxAmount = round($lineSubtotal * ($gstRate / 100), 2);
            $lineTotal = $lineSubtotal + $taxAmount;

            return [
                'productId' => $invoiceItem->product_id,
                'productName' => $invoiceItem->product_name,
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

        $returnCount = SalesReturn::where('business_id', $businessId)->count();
        $returnNumber = 'CN-'.str_pad((string) ($returnCount + 1), 6, '0', STR_PAD_LEFT);

        $productIds = array_unique(array_column($data['items'], 'productId'));
        $products = Product::whereIn('id', $productIds)->where('business_id', $businessId)->get()->keyBy('id');

        return DB::transaction(function () use (
            $businessId, $id, $invoice, $data, $invoiceItemMap, $products, $lineItems,
            $subtotal, $taxTotal, $grandTotal, $returnNumber,
        ) {
            $salesReturn = SalesReturn::create([
                'business_id' => $businessId,
                'sales_invoice_id' => $id,
                'customer_id' => $invoice->customer_id,
                'return_number' => $returnNumber,
                'subtotal' => $subtotal,
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
            ]);

            $returnItems = [];
            foreach ($lineItems as $li) {
                $returnItems[] = $salesReturn->items()->create([
                    'product_id' => $li['productId'],
                    'product_name' => $li['productName'],
                    'quantity' => $li['quantity'],
                    'unit_price' => $li['unitPrice'],
                    'gst_rate' => $li['gstRate'],
                    'tax_amount' => $li['taxAmount'],
                    'line_total' => $li['lineTotal'],
                ]);
            }

            $godownId = $this->resolveInvoiceGodownId($businessId, $invoice);

            foreach ($returnItems as $returnItem) {
                $product = $products->get($returnItem->product_id);
                $invoiceItem = $invoiceItemMap[$returnItem->product_id];
                $quantity = (float) $returnItem->quantity * (float) $invoiceItem->unit_conversion_factor;

                if (! $product->tracks_batches) {
                    $this->stockService->receiveExisting([
                        'businessId' => $businessId,
                        'productId' => $returnItem->product_id,
                        'godownId' => $godownId,
                        'batchId' => null,
                        'quantity' => $quantity,
                        'sourceType' => 'SALES_RETURN',
                        'sourceId' => $salesReturn->id,
                    ]);
                    continue;
                }

                $originalBatches = $invoiceItem->batches;
                $originalBatchIds = $originalBatches->pluck('batch_id')->all();

                $priorRestorations = SalesReturnItemBatch::whereIn('batch_id', $originalBatchIds)
                    ->whereHas('salesReturnItem', function ($q) use ($returnItem, $id) {
                        $q->where('product_id', $returnItem->product_id)
                            ->whereHas('salesReturn', fn ($q2) => $q2->where('sales_invoice_id', $id));
                    })
                    ->get();

                $alreadyRestoredByBatch = [];
                foreach ($priorRestorations as $r) {
                    $alreadyRestoredByBatch[$r->batch_id] = ($alreadyRestoredByBatch[$r->batch_id] ?? 0) + (float) $r->quantity;
                }

                $remaining = $quantity;
                foreach ($originalBatches as $consumption) {
                    if ($remaining <= 0) {
                        break;
                    }
                    $originallyConsumed = (float) $consumption->quantity;
                    $alreadyRestored = $alreadyRestoredByBatch[$consumption->batch_id] ?? 0;
                    $capacity = $originallyConsumed - $alreadyRestored;
                    $take = min($capacity, $remaining);
                    if ($take <= 0) {
                        continue;
                    }

                    $this->stockService->receiveExisting([
                        'businessId' => $businessId,
                        'productId' => $returnItem->product_id,
                        'godownId' => $godownId,
                        'batchId' => $consumption->batch_id,
                        'quantity' => $take,
                        'sourceType' => 'SALES_RETURN',
                        'sourceId' => $salesReturn->id,
                    ]);
                    SalesReturnItemBatch::create([
                        'sales_return_item_id' => $returnItem->id,
                        'batch_id' => $consumption->batch_id,
                        'quantity' => $take,
                    ]);
                    $remaining -= $take;
                }

                if ($remaining > 0) {
                    throw new HttpException(400, "Could not determine which batch to restore {$remaining} unit(s) of \"{$product->name}\" into");
                }
            }

            $salesReturnsAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::SALES_RETURNS);
            $gstPayableAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::GST_PAYABLE);
            $arAccount = $this->accountsService->getSystemAccount($businessId, SystemAccountCodes::ACCOUNTS_RECEIVABLE);

            $this->journalService->postEntry($businessId, [
                'sourceType' => 'SALES_RETURN',
                'sourceId' => $salesReturn->id,
                'narration' => "Sales return {$salesReturn->return_number}",
                'lines' => [
                    ['accountId' => $salesReturnsAccount->id, 'debit' => $subtotal],
                    ['accountId' => $gstPayableAccount->id, 'debit' => $taxTotal],
                    ['accountId' => $arAccount->id, 'credit' => $grandTotal],
                ],
            ]);

            return $salesReturn->fresh('items');
        });
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $invoice = $this->findOne($businessId, $id);
        $productIds = $invoice->items->pluck('product_id')->unique()->all();
        $products = Product::whereIn('id', $productIds)->where('business_id', $businessId)->get()->keyBy('id');

        return DB::transaction(function () use ($businessId, $id, $invoice, $products, $actor) {
            $godownId = $this->resolveInvoiceGodownId($businessId, $invoice);

            foreach ($invoice->items as $item) {
                $product = $products->get($item->product_id);
                $alreadyReturned = $invoice->returns
                    ->flatMap(fn ($r) => $r->items)
                    ->where('product_id', $item->product_id)
                    ->sum(fn ($ri) => (float) $ri->quantity);
                $netQuantity = (float) $item->quantity - $alreadyReturned;
                if ($netQuantity <= 0) {
                    continue;
                }
                $netBaseQuantity = $netQuantity * (float) $item->unit_conversion_factor;

                if (! $product->tracks_batches) {
                    $this->stockService->receiveExisting([
                        'businessId' => $businessId,
                        'productId' => $item->product_id,
                        'godownId' => $godownId,
                        'batchId' => null,
                        'quantity' => $netBaseQuantity,
                        'sourceType' => 'ADJUSTMENT',
                        'sourceId' => $id,
                    ]);
                    continue;
                }

                $originalBatchIds = $item->batches->pluck('batch_id')->all();
                $priorRestorations = SalesReturnItemBatch::whereIn('batch_id', $originalBatchIds)
                    ->whereHas('salesReturnItem', function ($q) use ($item, $id) {
                        $q->where('product_id', $item->product_id)
                            ->whereHas('salesReturn', fn ($q2) => $q2->where('sales_invoice_id', $id));
                    })
                    ->get();

                $alreadyRestoredByBatch = [];
                foreach ($priorRestorations as $r) {
                    $alreadyRestoredByBatch[$r->batch_id] = ($alreadyRestoredByBatch[$r->batch_id] ?? 0) + (float) $r->quantity;
                }

                $remaining = $netBaseQuantity;
                foreach ($item->batches as $consumption) {
                    if ($remaining <= 0) {
                        break;
                    }
                    $capacity = (float) $consumption->quantity - ($alreadyRestoredByBatch[$consumption->batch_id] ?? 0);
                    $take = min($capacity, $remaining);
                    if ($take <= 0) {
                        continue;
                    }
                    $this->stockService->receiveExisting([
                        'businessId' => $businessId,
                        'productId' => $item->product_id,
                        'godownId' => $godownId,
                        'batchId' => $consumption->batch_id,
                        'quantity' => $take,
                        'sourceType' => 'ADJUSTMENT',
                        'sourceId' => $id,
                    ]);
                    $remaining -= $take;
                }
            }

            $sourceIds = array_merge(
                [$id],
                $invoice->payments->pluck('id')->all(),
                $invoice->returns->pluck('id')->all(),
            );
            \App\Models\JournalEntry::where('business_id', $businessId)->whereIn('source_id', $sourceIds)->delete();

            $before = $invoice->toArray();
            $invoice->delete();

            $this->auditService->log([
                'businessId' => $businessId,
                'userId' => $actor['userId'],
                'userEmail' => $actor['userEmail'],
                'entityType' => 'SalesInvoice',
                'entityId' => $id,
                'action' => 'DELETE',
                'summary' => "Deleted sales invoice {$invoice->invoice_number}",
                'changes' => ['before' => $before],
            ]);

            return ['success' => true];
        });
    }
}
