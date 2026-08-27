import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string) {
    return this.prisma.purchaseBill.findMany({
      where: { businessId },
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id, businessId },
      include: {
        supplier: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!bill) {
      throw new NotFoundException('Purchase bill not found');
    }
    return bill;
  }

  async addPayment(businessId: string, id: string, dto: CreatePaymentDto) {
    const bill = await this.findOne(businessId, id);

    if (bill.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record a payment on a cancelled bill');
    }

    const balanceDue = Number(bill.grandTotal) - Number(bill.amountPaid);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(
        `Payment amount exceeds balance due (₹${balanceDue.toFixed(2)})`,
      );
    }

    const newAmountPaid = Number(bill.amountPaid) + dto.amount;
    const newStatus =
      newAmountPaid >= Number(bill.grandTotal) ? 'PAID' : 'PARTIALLY_PAID';

    return this.prisma.$transaction(async (tx) => {
      await tx.purchasePayment.create({
        data: {
          purchaseBillId: id,
          amount: dto.amount,
          paymentMode: dto.paymentMode ?? 'CASH',
          reference: dto.reference,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        },
      });

      return tx.purchaseBill.update({
        where: { id },
        data: { amountPaid: newAmountPaid, status: newStatus },
        include: {
          supplier: true,
          items: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });
    });
  }

  async create(businessId: string, dto: CreatePurchaseBillDto) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, businessId },
    });
    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, businessId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      if (!productMap.has(item.productId)) {
        throw new BadRequestException(
          `Product ${item.productId} not found`,
        );
      }
    }

    const lineItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice ?? Number(product.purchasePrice);
      const gstRate = Number(product.gstRate);
      const lineSubtotal = unitPrice * item.quantity;
      const taxAmount = Math.round(lineSubtotal * (gstRate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + taxAmount;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        gstRate,
        taxAmount,
        lineTotal,
        lineSubtotal,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineSubtotal, 0);
    const taxTotal = lineItems.reduce((sum, li) => sum + li.taxAmount, 0);
    const discountTotal = dto.discountTotal ?? 0;
    const grandTotal = subtotal + taxTotal - discountTotal;

    const billCount = await this.prisma.purchaseBill.count({
      where: { businessId },
    });
    const billNumber = `PUR-${String(billCount + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.purchaseBill.create({
        data: {
          businessId,
          supplierId: dto.supplierId,
          billNumber,
          status: 'UNPAID',
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              productName: li.productName,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              gstRate: li.gstRate,
              taxAmount: li.taxAmount,
              lineTotal: li.lineTotal,
            })),
          },
        },
        include: { items: true, supplier: true },
      });

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      return bill;
    });
  }

  async remove(businessId: string, id: string) {
    const bill = await this.findOne(businessId, id);

    return this.prisma.$transaction(async (tx) => {
      for (const item of bill.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: Number(item.quantity) } },
        });
      }
      await tx.purchaseBill.delete({ where: { id } });
      return { success: true };
    });
  }
}
