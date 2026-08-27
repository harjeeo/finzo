import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto.js';

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
      include: { supplier: true, items: true },
    });
    if (!bill) {
      throw new NotFoundException('Purchase bill not found');
    }
    return bill;
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
