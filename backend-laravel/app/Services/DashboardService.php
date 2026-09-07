<?php

namespace App\Services;

use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;

class DashboardService
{
    public function getSummary(string $businessId): array
    {
        $startOfDay = now()->startOfDay();
        $endOfDay = now()->endOfDay();

        $todaySales = (float) SalesInvoice::where('business_id', $businessId)
            ->whereBetween('invoice_date', [$startOfDay, $endOfDay])
            ->where('status', '!=', 'CANCELLED')
            ->sum('grand_total');

        $todayPurchases = (float) PurchaseBill::where('business_id', $businessId)
            ->whereBetween('bill_date', [$startOfDay, $endOfDay])
            ->where('status', '!=', 'CANCELLED')
            ->sum('grand_total');

        $receivables = (float) SalesInvoice::where('business_id', $businessId)
            ->whereNotIn('status', ['PAID', 'CANCELLED'])
            ->get(['grand_total', 'amount_paid'])
            ->sum(fn ($inv) => (float) $inv->grand_total - (float) $inv->amount_paid);

        $payables = (float) PurchaseBill::where('business_id', $businessId)
            ->whereNotIn('status', ['PAID', 'CANCELLED'])
            ->get(['grand_total', 'amount_paid'])
            ->sum(fn ($bill) => (float) $bill->grand_total - (float) $bill->amount_paid);

        $lowStockCount = Product::where('business_id', $businessId)
            ->where('min_stock_level', '>', 0)
            ->whereColumn('current_stock', '<=', 'min_stock_level')
            ->count();

        $recentSalesInvoices = SalesInvoice::with('customer')
            ->where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->take(5)
            ->get();

        return [
            'todaySales' => $todaySales,
            'todayPurchases' => $todayPurchases,
            'receivables' => $receivables,
            'payables' => $payables,
            'lowStockCount' => $lowStockCount,
            'recentSalesInvoices' => $recentSalesInvoices,
        ];
    }
}
