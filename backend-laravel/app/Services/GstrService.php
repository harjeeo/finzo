<?php

namespace App\Services;

use App\Models\Business;
use App\Models\PurchaseBill;
use App\Models\SalesInvoice;
use App\Support\GstStateCodes;

class GstrService
{
    private function dateRange(?string $from, ?string $to): ?array
    {
        if (! $from && ! $to) {
            return null;
        }

        return [
            'from' => $from ? "{$from} 00:00:00" : null,
            'to' => $to ? "{$to} 23:59:59.999" : null,
        ];
    }

    public function getGstr1(string $businessId, ?string $from, ?string $to): array
    {
        $business = Business::findOrFail($businessId);
        $businessStateCode = GstStateCodes::stateCodeFromGstin($business->gstin);

        $range = $this->dateRange($from, $to);
        $invoices = SalesInvoice::with('customer')
            ->where('business_id', $businessId)
            ->where('status', '!=', 'CANCELLED')
            ->when($range && $range['from'], fn ($q) => $q->where('invoice_date', '>=', $range['from']))
            ->when($range && $range['to'], fn ($q) => $q->where('invoice_date', '<=', $range['to']))
            ->orderBy('invoice_date')
            ->get();

        $rows = $invoices->map(function (SalesInvoice $invoice) use ($businessStateCode, $business) {
            $customerStateCode = GstStateCodes::stateCodeFromGstin($invoice->customer->gstin);
            $isInterState = $businessStateCode && $customerStateCode && $businessStateCode !== $customerStateCode;
            $taxableValue = (float) $invoice->subtotal - (float) $invoice->discount_total;
            $taxTotal = (float) $invoice->tax_total;

            return [
                'invoiceNumber' => $invoice->invoice_number,
                'invoiceDate' => $invoice->invoice_date->toJSON(),
                'customerName' => $invoice->customer->name,
                'gstin' => $invoice->customer->gstin,
                'supplyType' => $invoice->customer->gstin ? 'B2B' : 'B2C',
                'placeOfSupply' => GstStateCodes::stateNameFromGstin($invoice->customer->gstin) ?? $business->state,
                'taxableValue' => $taxableValue,
                'igst' => $isInterState ? $taxTotal : 0,
                'cgst' => $isInterState ? 0 : $taxTotal / 2,
                'sgst' => $isInterState ? 0 : $taxTotal / 2,
                'invoiceValue' => (float) $invoice->grand_total,
            ];
        })->values();

        $totals = [
            'taxableValue' => $rows->sum('taxableValue'),
            'igst' => $rows->sum('igst'),
            'cgst' => $rows->sum('cgst'),
            'sgst' => $rows->sum('sgst'),
            'invoiceValue' => $rows->sum('invoiceValue'),
        ];

        return [
            'from' => $from ?? null,
            'to' => $to ?? null,
            'businessGstin' => $business->gstin,
            'rows' => $rows->all(),
            'totals' => $totals,
        ];
    }

    public function getGstr3bSummary(string $businessId, ?string $from, ?string $to): array
    {
        $gstr1 = $this->getGstr1($businessId, $from, $to);

        $range = $this->dateRange($from, $to);
        $bills = PurchaseBill::where('business_id', $businessId)
            ->where('status', '!=', 'CANCELLED')
            ->when($range && $range['from'], fn ($q) => $q->where('bill_date', '>=', $range['from']))
            ->when($range && $range['to'], fn ($q) => $q->where('bill_date', '<=', $range['to']))
            ->get();

        $inwardTaxableValue = $bills->sum(fn ($b) => (float) $b->subtotal - (float) $b->discount_total);
        // Purchases don't carry a captured inter/intra-state split today, so ITC is
        // reported as a single pooled figure rather than split across IGST/CGST/SGST.
        $inwardTax = $bills->sum(fn ($b) => (float) $b->tax_total);

        $outward = [
            'taxableValue' => $gstr1['totals']['taxableValue'],
            'igst' => $gstr1['totals']['igst'],
            'cgst' => $gstr1['totals']['cgst'],
            'sgst' => $gstr1['totals']['sgst'],
            'total' => $gstr1['totals']['igst'] + $gstr1['totals']['cgst'] + $gstr1['totals']['sgst'],
        ];
        $inwardItc = [
            'taxableValue' => $inwardTaxableValue,
            'igst' => 0,
            'cgst' => 0,
            'sgst' => 0,
            'total' => $inwardTax,
        ];

        return [
            'from' => $from ?? null,
            'to' => $to ?? null,
            'outward' => $outward,
            'inwardItc' => $inwardItc,
            'netTaxPayable' => [
                'igst' => max($outward['igst'] - $inwardItc['igst'], 0),
                'cgst' => max($outward['cgst'], 0),
                'sgst' => max($outward['sgst'], 0),
                'total' => max($outward['total'] - $inwardItc['total'], 0),
            ],
        ];
    }

    public function toCsv(array $report): string
    {
        $header = [
            'Invoice Number', 'Invoice Date', 'Customer Name', 'GSTIN', 'Supply Type',
            'Place of Supply', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Invoice Value',
        ];
        $escape = function ($v) {
            $s = (string) $v;

            return preg_match('/[",\n]/', $s) ? '"'.str_replace('"', '""', $s).'"' : $s;
        };

        $lines = [implode(',', $header)];
        foreach ($report['rows'] as $row) {
            $lines[] = implode(',', array_map($escape, [
                $row['invoiceNumber'],
                substr($row['invoiceDate'], 0, 10),
                $row['customerName'],
                $row['gstin'] ?? '',
                $row['supplyType'],
                $row['placeOfSupply'] ?? '',
                number_format($row['taxableValue'], 2, '.', ''),
                number_format($row['igst'], 2, '.', ''),
                number_format($row['cgst'], 2, '.', ''),
                number_format($row['sgst'], 2, '.', ''),
                number_format($row['invoiceValue'], 2, '.', ''),
            ]));
        }
        $lines[] = implode(',', array_map($escape, [
            'TOTAL', '', '', '', '', '',
            number_format($report['totals']['taxableValue'], 2, '.', ''),
            number_format($report['totals']['igst'], 2, '.', ''),
            number_format($report['totals']['cgst'], 2, '.', ''),
            number_format($report['totals']['sgst'], 2, '.', ''),
            number_format($report['totals']['invoiceValue'], 2, '.', ''),
        ]));

        return implode("\n", $lines);
    }
}
