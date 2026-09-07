<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\SalesInvoice;
use App\Models\SalesPayment;
use App\Models\SalesReturn;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CustomerService
{
    public function __construct(private readonly AuditService $auditService) {}

    public function findAll(string $businessId)
    {
        return Customer::where('business_id', $businessId)
            ->orderByDesc('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Customer
    {
        $customer = Customer::where('business_id', $businessId)->find($id);

        if (! $customer) {
            throw new HttpException(404, 'Customer not found');
        }

        return $customer;
    }

    public function create(string $businessId, array $data, array $actor): Customer
    {
        $customer = Customer::create([
            'business_id' => $businessId,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'gstin' => $data['gstin'] ?? null,
            'address' => $data['address'] ?? null,
            'opening_balance' => $data['openingBalance'] ?? 0,
            'credit_limit' => $data['creditLimit'] ?? null,
        ]);

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Customer',
            'entityId' => $customer->id,
            'action' => 'CREATE',
            'summary' => "Created customer \"{$customer->name}\"",
            'changes' => ['after' => $customer->toArray()],
        ]);

        return $customer;
    }

    public function update(string $businessId, string $id, array $data, array $actor): Customer
    {
        $customer = $this->findOne($businessId, $id);
        $before = $customer->toArray();

        $customer->fill([
            'name' => $data['name'] ?? $customer->name,
            'phone' => array_key_exists('phone', $data) ? $data['phone'] : $customer->phone,
            'email' => array_key_exists('email', $data) ? $data['email'] : $customer->email,
            'gstin' => array_key_exists('gstin', $data) ? $data['gstin'] : $customer->gstin,
            'address' => array_key_exists('address', $data) ? $data['address'] : $customer->address,
            'opening_balance' => $data['openingBalance'] ?? $customer->opening_balance,
            'credit_limit' => array_key_exists('creditLimit', $data) ? $data['creditLimit'] : $customer->credit_limit,
        ]);
        $customer->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'Customer',
            'entityId' => $id,
            'action' => 'UPDATE',
            'summary' => "Updated customer \"{$customer->name}\"",
            'changes' => ['before' => $before, 'after' => $customer->toArray()],
        ]);

        return $customer;
    }

    public function remove(string $businessId, string $id, array $actor): array
    {
        $customer = $this->findOne($businessId, $id);

        DB::transaction(function () use ($customer, $businessId, $actor) {
            $before = $customer->toArray();
            $customer->delete();

            $this->auditService->log([
                'businessId' => $businessId,
                'userId' => $actor['userId'],
                'userEmail' => $actor['userEmail'],
                'entityType' => 'Customer',
                'entityId' => $customer->id,
                'action' => 'DELETE',
                'summary' => "Deleted customer \"{$customer->name}\"",
                'changes' => ['before' => $before],
            ]);
        });

        return ['success' => true];
    }

    public function getLedger(string $businessId, string $id): array
    {
        $customer = $this->findOne($businessId, $id);

        $invoices = SalesInvoice::where('business_id', $businessId)
            ->where('customer_id', $id)
            ->where('status', '!=', 'CANCELLED')
            ->get(['id', 'invoice_number', 'invoice_date', 'grand_total']);

        $payments = SalesPayment::whereHas('salesInvoice', function ($q) use ($businessId, $id) {
            $q->where('business_id', $businessId)->where('customer_id', $id);
        })->with('salesInvoice:id,invoice_number')->get(['id', 'sales_invoice_id', 'amount', 'payment_date', 'payment_mode']);

        $returns = SalesReturn::where('business_id', $businessId)
            ->where('customer_id', $id)
            ->get(['id', 'return_number', 'return_date', 'grand_total']);

        $entries = collect()
            ->concat($invoices->map(fn ($inv) => [
                'date' => $inv->invoice_date,
                'type' => 'INVOICE',
                'reference' => $inv->invoice_number,
                'debit' => (float) $inv->grand_total,
                'credit' => 0,
            ]))
            ->concat($payments->map(fn ($p) => [
                'date' => $p->payment_date,
                'type' => 'PAYMENT',
                'reference' => "{$p->salesInvoice->invoice_number} · {$p->payment_mode}",
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

        $balance = (float) $customer->opening_balance;
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
            'customer' => $customer,
            'openingBalance' => (float) $customer->opening_balance,
            'transactions' => $transactions,
            'outstandingBalance' => $balance,
        ];
    }
}
