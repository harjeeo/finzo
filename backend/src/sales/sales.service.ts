import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string) {
    return this.prisma.salesInvoice.findMany({
      where: { businessId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Sales invoice not found');
    }
    return invoice;
  }

  async addPayment(businessId: string, id: string, dto: CreatePaymentDto) {
    const invoice = await this.findOne(businessId, id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record a payment on a cancelled invoice');
    }

    const balanceDue = Number(invoice.grandTotal) - Number(invoice.amountPaid);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(
        `Payment amount exceeds balance due (₹${balanceDue.toFixed(2)})`,
      );
    }

    const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
    const newStatus =
      newAmountPaid >= Number(invoice.grandTotal)
        ? 'PAID'
        : 'PARTIALLY_PAID';

    return this.prisma.$transaction(async (tx) => {
      await tx.salesPayment.create({
        data: {
          salesInvoiceId: id,
          amount: dto.amount,
          paymentMode: dto.paymentMode ?? 'CASH',
          reference: dto.reference,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        },
      });

      return tx.salesInvoice.update({
        where: { id },
        data: { amountPaid: newAmountPaid, status: newStatus },
        include: {
          customer: true,
          items: true,
          payments: { orderBy: { paymentDate: 'desc' } },
        },
      });
    });
  }

  async create(businessId: string, dto: CreateSalesInvoiceDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, businessId },
    });
    if (!customer) {
      throw new BadRequestException('Customer not found');
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, businessId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found`,
        );
      }
      if (Number(product.currentStock) < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}" (available: ${product.currentStock})`,
        );
      }
    }

    const lineItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice ?? Number(product.sellingPrice);
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
    const amountPaid = Math.min(dto.amountPaid ?? 0, grandTotal);
    const status =
      amountPaid >= grandTotal && grandTotal > 0
        ? 'PAID'
        : amountPaid > 0
          ? 'PARTIALLY_PAID'
          : 'UNPAID';

    const business = await this.prisma.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    const invoiceCount = await this.prisma.salesInvoice.count({
      where: { businessId },
    });
    const invoiceNumber = `${business.invoicePrefix}-${String(invoiceCount + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.create({
        data: {
          businessId,
          customerId: dto.customerId,
          invoiceNumber,
          status,
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          amountPaid,
          paymentMode: dto.paymentMode,
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
        include: { items: true, customer: true },
      });

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }

      return invoice;
    });
  }

  async remove(businessId: string, id: string) {
    const invoice = await this.findOne(businessId, id);

    return this.prisma.$transaction(async (tx) => {
      for (const item of invoice.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: Number(item.quantity) } },
        });
      }
      await tx.salesInvoice.delete({ where: { id } });
      return { success: true };
    });
  }
}
