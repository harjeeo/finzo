<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Customer;
use App\Models\Product;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SuperAdminService
{
    public function getStats(): array
    {
        $startOfMonth = now()->startOfMonth();

        $salesThisMonth = SalesInvoice::where('created_at', '>=', $startOfMonth);

        return [
            'businessCount' => Business::count(),
            'activeBusinessCount' => Business::where('status', 'ACTIVE')->count(),
            'suspendedBusinessCount' => Business::where('status', 'SUSPENDED')->count(),
            'userCount' => User::count(),
            'newBusinessesThisMonth' => Business::where('created_at', '>=', $startOfMonth)->count(),
            'salesThisMonth' => [
                'total' => (float) (clone $salesThisMonth)->sum('grand_total'),
                'count' => (clone $salesThisMonth)->count(),
            ],
        ];
    }

    public function findAllBusinesses()
    {
        $businesses = Business::with(['memberships' => function ($q) {
            $q->where('role', 'OWNER')->with('user:id,name,email')->limit(1);
        }])
            ->withCount(['memberships', 'salesInvoices', 'purchaseBills'])
            ->orderByDesc('created_at')
            ->get();

        return $businesses->map(function (Business $b) {
            $owner = $b->memberships->first()?->user;

            return [
                'id' => $b->id,
                'name' => $b->name,
                'gstin' => $b->gstin,
                'city' => $b->city,
                'state' => $b->state,
                'status' => $b->status,
                'createdAt' => $b->created_at->toJSON(),
                'owner' => $owner ? ['name' => $owner->name, 'email' => $owner->email] : null,
                'memberCount' => $b->memberships_count,
                'salesInvoiceCount' => $b->sales_invoices_count,
                'purchaseBillCount' => $b->purchase_bills_count,
            ];
        })->values()->all();
    }

    public function findOneBusiness(string $id): array
    {
        $business = Business::with(['memberships.user:id,name,email'])->find($id);

        if (! $business) {
            throw new HttpException(404, 'Business not found');
        }

        $salesQuery = SalesInvoice::where('business_id', $id);
        $purchaseQuery = PurchaseBill::where('business_id', $id);

        return [
            'id' => $business->id,
            'name' => $business->name,
            'gstin' => $business->gstin,
            'pan' => $business->pan,
            'address' => $business->address,
            'city' => $business->city,
            'state' => $business->state,
            'pincode' => $business->pincode,
            'status' => $business->status,
            'createdAt' => $business->created_at->toJSON(),
            'members' => $business->memberships->map(fn ($m) => [
                'id' => $m->id,
                'role' => $m->role,
                'user' => ['id' => $m->user->id, 'name' => $m->user->name, 'email' => $m->user->email],
            ])->values()->all(),
            'stats' => [
                'totalSales' => (float) (clone $salesQuery)->sum('grand_total'),
                'salesInvoiceCount' => (clone $salesQuery)->count(),
                'totalPurchases' => (float) (clone $purchaseQuery)->sum('grand_total'),
                'purchaseBillCount' => (clone $purchaseQuery)->count(),
                'customerCount' => Customer::where('business_id', $id)->count(),
                'productCount' => Product::where('business_id', $id)->count(),
            ],
        ];
    }

    public function updateBusinessStatus(string $id, string $status): Business
    {
        $business = Business::find($id);

        if (! $business) {
            throw new HttpException(404, 'Business not found');
        }

        $business->status = $status;
        $business->save();

        return $business;
    }
}
