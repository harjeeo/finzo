import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(businessId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      todaySalesAgg,
      todayPurchasesAgg,
      receivablesInvoices,
      payablesBills,
      lowStockProducts,
      recentSalesInvoices,
    ] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: {
          businessId,
          invoiceDate: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: {
          businessId,
          billDate: { gte: startOfDay, lte: endOfDay },
          status: { not: 'CANCELLED' },
        },
        _sum: { grandTotal: true },
      }),
      this.prisma.salesInvoice.findMany({
        where: { businessId, status: { notIn: ['PAID', 'CANCELLED'] } },
        select: { grandTotal: true, amountPaid: true },
      }),
      this.prisma.purchaseBill.findMany({
        where: { businessId, status: { notIn: ['PAID', 'CANCELLED'] } },
        select: { grandTotal: true, amountPaid: true },
      }),
      this.prisma.product.findMany({
        where: { businessId, minStockLevel: { gt: 0 } },
        select: { id: true, name: true, currentStock: true, minStockLevel: true },
      }),
      this.prisma.salesInvoice.findMany({
        where: { businessId },
        include: { customer: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const receivables = receivablesInvoices.reduce(
      (sum, inv) => sum + (Number(inv.grandTotal) - Number(inv.amountPaid)),
      0,
    );
    const payables = payablesBills.reduce(
      (sum, bill) => sum + (Number(bill.grandTotal) - Number(bill.amountPaid)),
      0,
    );
    const lowStockCount = lowStockProducts.filter(
      (p) => Number(p.currentStock) <= Number(p.minStockLevel),
    ).length;

    return {
      todaySales: Number(todaySalesAgg._sum.grandTotal ?? 0),
      todayPurchases: Number(todayPurchasesAgg._sum.grandTotal ?? 0),
      receivables,
      payables,
      lowStockCount,
      recentSalesInvoices,
    };
  }
}
