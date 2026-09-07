<?php

namespace App\Services;

use App\Models\EwayBill;
use App\Models\SalesInvoice;
use Symfony\Component\HttpKernel\Exception\HttpException;

/** Under GST rules, an E-Way Bill is required to move goods worth ₹50,000+. */
class EwayBillService
{
    public const EWAY_BILL_THRESHOLD = 50000;

    public function __construct(private readonly AuditService $auditService) {}

    /** 1 day of validity per 200km of distance (simplified regular-vehicle rule), minimum 1 day. */
    private function computeValidUntil(int $distanceKm): \Illuminate\Support\Carbon
    {
        $days = max(1, (int) ceil($distanceKm / 200));

        return now()->addDays($days);
    }

    private function findInvoiceOrThrow(string $businessId, string $invoiceId): SalesInvoice
    {
        $invoice = SalesInvoice::where('id', $invoiceId)->where('business_id', $businessId)->first();

        if (! $invoice) {
            throw new HttpException(404, 'Sales invoice not found');
        }

        return $invoice;
    }

    public function findByInvoice(string $businessId, string $invoiceId): ?EwayBill
    {
        $this->findInvoiceOrThrow($businessId, $invoiceId);

        return EwayBill::where('sales_invoice_id', $invoiceId)->first();
    }

    public function generate(string $businessId, string $invoiceId, array $data, array $actor): EwayBill
    {
        $invoice = $this->findInvoiceOrThrow($businessId, $invoiceId);

        if ($invoice->status === 'CANCELLED') {
            throw new HttpException(400, 'Cannot generate an E-Way Bill for a cancelled invoice');
        }

        $existing = EwayBill::where('sales_invoice_id', $invoiceId)->first();
        if ($existing && $existing->status === 'GENERATED') {
            throw new HttpException(400, 'An active E-Way Bill already exists for this invoice. Cancel it first to generate a new one.');
        }

        $fields = [
            'transporter_name' => $data['transporterName'] ?? null,
            'transporter_id' => $data['transporterId'] ?? null,
            'vehicle_number' => $data['vehicleNumber'] ?? null,
            'transport_mode' => $data['transportMode'] ?? 'ROAD',
            'distance_km' => $data['distanceKm'],
            'ewb_number' => $data['ewbNumber'] ?? null,
            'valid_until' => $this->computeValidUntil($data['distanceKm']),
            'status' => 'GENERATED',
        ];

        if ($existing) {
            $existing->fill($fields);
            $existing->save();
            $ewayBill = $existing;
        } else {
            $ewayBill = EwayBill::create(array_merge($fields, [
                'business_id' => $businessId,
                'sales_invoice_id' => $invoiceId,
            ]));
        }

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'EwayBill',
            'entityId' => $ewayBill->id,
            'action' => $existing ? 'UPDATE' : 'CREATE',
            'summary' => "Generated E-Way Bill for invoice {$invoice->invoice_number}",
            'changes' => ['after' => $ewayBill->toArray()],
        ]);

        return $ewayBill;
    }

    public function update(string $businessId, string $invoiceId, array $data, array $actor): EwayBill
    {
        $this->findInvoiceOrThrow($businessId, $invoiceId);
        $existing = EwayBill::where('sales_invoice_id', $invoiceId)->first();

        if (! $existing) {
            throw new HttpException(404, 'No E-Way Bill exists for this invoice yet');
        }

        $before = $existing->toArray();

        $map = [
            'transporterName' => 'transporter_name', 'transporterId' => 'transporter_id',
            'vehicleNumber' => 'vehicle_number', 'transportMode' => 'transport_mode',
            'ewbNumber' => 'ewb_number',
        ];
        foreach ($map as $requestKey => $column) {
            if (array_key_exists($requestKey, $data)) {
                $existing->{$column} = $data[$requestKey];
            }
        }
        if (! empty($data['distanceKm'])) {
            $existing->distance_km = $data['distanceKm'];
            $existing->valid_until = $this->computeValidUntil($data['distanceKm']);
        }
        $existing->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'EwayBill',
            'entityId' => $existing->id,
            'action' => 'UPDATE',
            'summary' => 'Updated E-Way Bill '.($existing->ewb_number ?? $existing->id),
            'changes' => ['before' => $before, 'after' => $existing->toArray()],
        ]);

        return $existing;
    }

    public function cancel(string $businessId, string $invoiceId, array $actor): EwayBill
    {
        $this->findInvoiceOrThrow($businessId, $invoiceId);
        $existing = EwayBill::where('sales_invoice_id', $invoiceId)->first();

        if (! $existing) {
            throw new HttpException(404, 'No E-Way Bill exists for this invoice');
        }
        if ($existing->status === 'CANCELLED') {
            throw new HttpException(400, 'This E-Way Bill is already cancelled');
        }

        $before = $existing->toArray();
        $existing->status = 'CANCELLED';
        $existing->save();

        $this->auditService->log([
            'businessId' => $businessId,
            'userId' => $actor['userId'],
            'userEmail' => $actor['userEmail'],
            'entityType' => 'EwayBill',
            'entityId' => $existing->id,
            'action' => 'UPDATE',
            'summary' => 'Cancelled E-Way Bill '.($existing->ewb_number ?? $existing->id),
            'changes' => ['before' => $before, 'after' => $existing->toArray()],
        ]);

        return $existing;
    }
}
