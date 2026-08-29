import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { stateCodeFromGstin, stateNameFromGstin } from './gst-state-codes.js';

export interface Gstr1Row {
  invoiceNumber: string;
  invoiceDate: Date;
  customerName: string;
  gstin: string | null;
  supplyType: 'B2B' | 'B2C';
  placeOfSupply: string | null;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoiceValue: number;
}

export interface Gstr1Report {
  from: string | null;
  to: string | null;
  businessGstin: string | null;
  rows: Gstr1Row[];
  totals: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    invoiceValue: number;
  };
}

export interface Gstr3bSummary {
  from: string | null;
  to: string | null;
  outward: { taxableValue: number; igst: number; cgst: number; sgst: number; total: number };
  inwardItc: { taxableValue: number; igst: number; cgst: number; sgst: number; total: number };
  netTaxPayable: { igst: number; cgst: number; sgst: number; total: number };
}

@Injectable()
export class GstrService {
  constructor(private readonly prisma: PrismaService) {}

  private dateRange(from?: string, to?: string) {
    if (!from && !to) return undefined;
    return {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
    };
  }

  async getGstr1(businessId: string, from?: string, to?: string): Promise<Gstr1Report> {
    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    const businessStateCode = stateCodeFromGstin(business.gstin);

    const invoices = await this.prisma.salesInvoice.findMany({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        ...(this.dateRange(from, to) ? { invoiceDate: this.dateRange(from, to) } : {}),
      },
      include: { customer: true },
      orderBy: { invoiceDate: 'asc' },
    });

    const rows: Gstr1Row[] = invoices.map((invoice) => {
      const customerStateCode = stateCodeFromGstin(invoice.customer.gstin);
      const isInterState = Boolean(
        businessStateCode && customerStateCode && businessStateCode !== customerStateCode,
      );
      const taxableValue = Number(invoice.subtotal) - Number(invoice.discountTotal);
      const taxTotal = Number(invoice.taxTotal);

      return {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        customerName: invoice.customer.name,
        gstin: invoice.customer.gstin,
        supplyType: invoice.customer.gstin ? 'B2B' : 'B2C',
        placeOfSupply: stateNameFromGstin(invoice.customer.gstin) ?? business.state ?? null,
        taxableValue,
        igst: isInterState ? taxTotal : 0,
        cgst: isInterState ? 0 : taxTotal / 2,
        sgst: isInterState ? 0 : taxTotal / 2,
        invoiceValue: Number(invoice.grandTotal),
      };
    });

    const totals = rows.reduce(
      (acc, r) => ({
        taxableValue: acc.taxableValue + r.taxableValue,
        igst: acc.igst + r.igst,
        cgst: acc.cgst + r.cgst,
        sgst: acc.sgst + r.sgst,
        invoiceValue: acc.invoiceValue + r.invoiceValue,
      }),
      { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, invoiceValue: 0 },
    );

    return {
      from: from ?? null,
      to: to ?? null,
      businessGstin: business.gstin,
      rows,
      totals,
    };
  }

  async getGstr3bSummary(businessId: string, from?: string, to?: string): Promise<Gstr3bSummary> {
    const gstr1 = await this.getGstr1(businessId, from, to);

    const bills = await this.prisma.purchaseBill.findMany({
      where: {
        businessId,
        status: { not: 'CANCELLED' },
        ...(this.dateRange(from, to) ? { billDate: this.dateRange(from, to) } : {}),
      },
    });

    const inwardTaxableValue = bills.reduce(
      (sum, b) => sum + Number(b.subtotal) - Number(b.discountTotal),
      0,
    );
    // Purchases don't carry a captured inter/intra-state split today, so ITC is
    // reported as a single pooled figure rather than split across IGST/CGST/SGST.
    const inwardTax = bills.reduce((sum, b) => sum + Number(b.taxTotal), 0);

    const outward = {
      taxableValue: gstr1.totals.taxableValue,
      igst: gstr1.totals.igst,
      cgst: gstr1.totals.cgst,
      sgst: gstr1.totals.sgst,
      total: gstr1.totals.igst + gstr1.totals.cgst + gstr1.totals.sgst,
    };
    const inwardItc = {
      taxableValue: inwardTaxableValue,
      igst: 0,
      cgst: 0,
      sgst: 0,
      total: inwardTax,
    };

    return {
      from: from ?? null,
      to: to ?? null,
      outward,
      inwardItc,
      netTaxPayable: {
        igst: Math.max(outward.igst - inwardItc.igst, 0),
        cgst: Math.max(outward.cgst, 0),
        sgst: Math.max(outward.sgst, 0),
        total: Math.max(outward.total - inwardItc.total, 0),
      },
    };
  }

  toCsv(report: Gstr1Report): string {
    const header = [
      'Invoice Number',
      'Invoice Date',
      'Customer Name',
      'GSTIN',
      'Supply Type',
      'Place of Supply',
      'Taxable Value',
      'IGST',
      'CGST',
      'SGST',
      'Invoice Value',
    ];
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(',')];
    for (const row of report.rows) {
      lines.push(
        [
          row.invoiceNumber,
          row.invoiceDate.toISOString().slice(0, 10),
          row.customerName,
          row.gstin ?? '',
          row.supplyType,
          row.placeOfSupply ?? '',
          row.taxableValue.toFixed(2),
          row.igst.toFixed(2),
          row.cgst.toFixed(2),
          row.sgst.toFixed(2),
          row.invoiceValue.toFixed(2),
        ]
          .map(escape)
          .join(','),
      );
    }
    lines.push(
      [
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        report.totals.taxableValue.toFixed(2),
        report.totals.igst.toFixed(2),
        report.totals.cgst.toFixed(2),
        report.totals.sgst.toFixed(2),
        report.totals.invoiceValue.toFixed(2),
      ].join(','),
    );
    return lines.join('\n');
  }
}
