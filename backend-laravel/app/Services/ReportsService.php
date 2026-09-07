<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;
use Carbon\Carbon;

class ReportsService
{
    private function resolveRange(?string $from, ?string $to): array
    {
        $start = $from ? Carbon::parse($from)->startOfDay() : Carbon::createFromTimestamp(0);
        $end = $to ? Carbon::parse($to)->endOfDay() : now();

        return [$start, $end];
    }

    public function getSummary(string $businessId, ?string $from, ?string $to, ?string $branchId = null): array
    {
        [$start, $end] = $this->resolveRange($from, $to);

        $salesQuery = SalesInvoice::where('business_id', $businessId)
            ->whereBetween('invoice_date', [$start, $end])
            ->where('status', '!=', 'CANCELLED')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $salesTotal = (float) (clone $salesQuery)->sum('grand_total');
        $salesSubtotal = (float) (clone $salesQuery)->sum('subtotal');
        $salesTax = (float) (clone $salesQuery)->sum('tax_total');
        $salesCount = (clone $salesQuery)->count();

        $purchaseQuery = PurchaseBill::where('business_id', $businessId)
            ->whereBetween('bill_date', [$start, $end])
            ->where('status', '!=', 'CANCELLED')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $purchaseTotal = (float) (clone $purchaseQuery)->sum('grand_total');
        $purchaseSubtotal = (float) (clone $purchaseQuery)->sum('subtotal');
        $purchaseTax = (float) (clone $purchaseQuery)->sum('tax_total');
        $purchaseCount = (clone $purchaseQuery)->count();

        $expenseQuery = Expense::where('business_id', $businessId)
            ->whereBetween('expense_date', [$start, $end])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));
        $expenseTotal = (float) (clone $expenseQuery)->sum('amount');
        $expenseCount = (clone $expenseQuery)->count();

        return [
            'range' => ['from' => $start->toJSON(), 'to' => $end->toJSON()],
            'sales' => [
                'total' => $salesTotal,
                'subtotal' => $salesSubtotal,
                'tax' => $salesTax,
                'count' => $salesCount,
            ],
            'purchases' => [
                'total' => $purchaseTotal,
                'subtotal' => $purchaseSubtotal,
                'tax' => $purchaseTax,
                'count' => $purchaseCount,
            ],
            'expenses' => [
                'total' => $expenseTotal,
                'count' => $expenseCount,
            ],
            'netProfit' => $salesTotal - $purchaseTotal - $expenseTotal,
        ];
    }

    public function getStockReport(string $businessId): array
    {
        $products = Product::where('business_id', $businessId)
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'unit', 'current_stock', 'purchase_price', 'selling_price']);

        $items = $products->map(function (Product $p) {
            $stockValue = (float) $p->current_stock * (float) $p->purchase_price;

            return [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'unit' => $p->unit,
                'currentStock' => (string) $p->current_stock,
                'purchasePrice' => (string) $p->purchase_price,
                'sellingPrice' => (string) $p->selling_price,
                'stockValue' => $stockValue,
            ];
        });

        return [
            'items' => $items->values()->all(),
            'totalStockValue' => $items->sum('stockValue'),
        ];
    }
}
