import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface DateRange {
  from?: string;
  to?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRange({ from, to }: DateRange) {
    const start = from ? new Date(from) : new Date(0);
    start.setHours(0, 0, 0, 0);
    const end = to ? new Date(to) : new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  async getSummary(businessId: string, range: DateRange) {
    const { start, end } = this.resolveRange(range);

    const [salesAgg, purchaseAgg, expenseAgg] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: {
          businessId,
          invoiceDate: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        _sum: { subtotal: true, taxTotal: true, grandTotal: true },
        _count: true,
      }),
      this.prisma.purchaseBill.aggregate({
        where: {
          businessId,
          billDate: { gte: start, lte: end },
          status: { not: 'CANCELLED' },
        },
        _sum: { subtotal: true, taxTotal: true, grandTotal: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { businessId, expenseDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const salesTotal = Number(salesAgg._sum.grandTotal ?? 0);
    const purchaseTotal = Number(purchaseAgg._sum.grandTotal ?? 0);
    const expenseTotal = Number(expenseAgg._sum.amount ?? 0);

    return {
      range: { from: start.toISOString(), to: end.toISOString() },
      sales: {
        total: salesTotal,
        subtotal: Number(salesAgg._sum.subtotal ?? 0),
        tax: Number(salesAgg._sum.taxTotal ?? 0),
        count: salesAgg._count,
      },
      purchases: {
        total: purchaseTotal,
        subtotal: Number(purchaseAgg._sum.subtotal ?? 0),
        tax: Number(purchaseAgg._sum.taxTotal ?? 0),
        count: purchaseAgg._count,
      },
      expenses: {
        total: expenseTotal,
        count: expenseAgg._count,
      },
      netProfit: salesTotal - purchaseTotal - expenseTotal,
    };
  }

  async getStockReport(businessId: string) {
    const products = await this.prisma.product.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        currentStock: true,
        purchasePrice: true,
        sellingPrice: true,
      },
      orderBy: { name: 'asc' },
    });

    const items = products.map((p) => ({
      ...p,
      stockValue: Number(p.currentStock) * Number(p.purchasePrice),
    }));

    const totalStockValue = items.reduce((sum, i) => sum + i.stockValue, 0);

    return { items, totalStockValue };
  }
}
