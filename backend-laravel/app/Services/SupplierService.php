<?php

namespace App\Services;

use App\Models\PurchaseBill;
use App\Models\PurchasePayment;
use App\Models\PurchaseReturn;
use App\Models\Supplier;
use Symfony\Component\HttpKernel\Exception\HttpException;

class SupplierService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return Supplier::where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Supplier
    {
        $supplier = Supplier::where('business_id', $businessId)->find($id);

        if (! $supplier) {
            throw new HttpException(404, 'Supplier not found');
        }

        return $supplier;
    }

    public function create(string $businessId, array $data, array $actor): Supplier
    {
        $supplier = Supplier::create([
            'business_id' => $businessId,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'gstin' => $data['gstin'] ?? null,
            'address' => $data['address'] ?? null,
            'opening_balance' => $data['openingBalance'] ?? 0,
        ]);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Supplier',
            'entityId' => $supplier->id,
            'action' => 'CREATE',
            'summary' => "Created supplier \"{$supplier->name}\"",
            'changes' => ['after' => $supplier->toArray()],
        ]);

        return $supplier;
    }

    public function update(string $businessId, string $id, array $data, array $actor): Supplier
    {
        $supplier = $this->findOne($businessId, $id);
        $before = $supplier->toArray();

        $supplier->fill([
            'name' => $data['name'] ?? $supplier->name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $supplier->phone,
            'email' => array_key_exists('email', $data) ? $data['email'] : $supplier->email,
            'gstin' => array_key_exists('gstin', $data) ? $data['gstin'] : $supplier->gstin,
            'address' => array_key_exists('address', $data) ? $data['address'] : $supplier->address,
            'opening_balance' => $data['openingBalance'] ?? $supplier->opening_balance,
        ]);
        $supplier->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Supplier',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated supplier \"{$supplier->name}\"",
            'changes' => ['before' => $before, 'after' => $supplier->toArray()],
        ]);

        return $supplier;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $supplier = $this->findOne($businessId, $id);
        $before = $supplier->toArray();
        $supplier->delete();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Supplier',
            'entityId' => $id,
            'action' => 'DELETE',
            'summary' => "Deleted supplier \"{$supplier->name}\"",
            'changes' => ['before' => $before],
        ]);

        return ['success' => true];
    }

    public function getLedger(string $businessId, string $id): array
    {
        $supplier = $this->findOne($businessId, $id);

        $bills = PurchaseBill::where('business_id', $businessId)
            ->where('supplier_id', $id)
            ->where('status', '!=', 'CANCELLED')
            ->get(['id', 'bill_number', 'bill_date', 'grand_total']);

        $payments = PurchasePayment::whereHas('purchaseBill', function ($q) use ($businessId, $id) {
            $q->where('business_id', $businessId)->where('supplier_id', $id);
        })->with('purchaseBill:id,bill_number')->get(['id', 'purchase_bill_id', 'amount', 'payment_date', 'payment_mode']);

        $returns = PurchaseReturn::where('business_id', $businessId)
            ->where('supplier_id', $id)
            ->get(['id', 'return_number', 'return_date', 'grand_total']);

        $entries = collect()
            ->concat($bills->map(fn ($bill) => [
                'date' => $bill->bill_date,
                'type' => 'BILL',
                'reference' => $bill->bill_number,
                'debit' => (float) $bill->grand_total,
                'credit' => 0,
            ]))
            ->concat($payments->map(fn ($p) => [
                'date' => $p->payment_date,
                'type' => 'PAYMENT',
                'reference' => "{$p->purchaseBill->bill_number} · {$p->payment_mode}",
                'debit' => 0,
                'credit' => (float) $p->amount,
            ]))
            ->concat($returns->map(fn ($ret) => [
                'date' => $ret->return_date,
                'type' => 'RETURN',
                'reference' => $ret->return_number,
                'debit' => 0,
                'credit' => (float) $ret->grand_total,
            ]))
            ->sortBy(fn ($e) => $e['date']->timestamp)
            ->values();

        $balance = (float) $supplier->opening_balance;
        $transactions = $entries->map(function ($entry) use (&$balance) {
            $balance += $entry['debit'] - $entry['credit'];

            return [
                'date' => $entry['date']->toJSON(),
                'type' => $entry['type'],
                'reference' => $entry['reference'],
                'debit' => $entry['debit'],
                'credit' => $entry['credit'],
                'balance' => $balance,
            ];
        })->values()->all();

        return [
            'supplier' => $supplier,
            'openingBalance' => (float) $supplier->opening_balance,
            'transactions' => $transactions,
            'outstandingBalance' => $balance,
        ];
    }
}
