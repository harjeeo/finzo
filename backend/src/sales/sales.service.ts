import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto.js';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
  ) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.salesInvoice.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: { customer: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        branch: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        returns: {
          include: { items: true },
          orderBy: { returnDate: 'desc' },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException('Sales invoice not found');
    }
    return invoice;
  }

  async createReturn(businessId: string, id: string, dto: CreateSalesReturnDto) {
    const invoice = await this.findOne(businessId, id);

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cannot return items on a cancelled invoice');
    }

    const invoiceItemMap = new Map(
      invoice.items.map((item) => [item.productId, item]),
    );
    const alreadyReturned = new Map<string, number>();
    for (const ret of invoice.returns) {
      for (const item of ret.items) {
        alreadyReturned.set(
          item.productId,
          (alreadyReturned.get(item.productId) ?? 0) + Number(item.quantity),
        );
      }
    }

    const lineItems = dto.items.map((item) => {
      const invoiceItem = invoiceItemMap.get(item.productId);
      if (!invoiceItem) {
        throw new BadRequestException(
          `Product ${item.productId} was not part of this invoice`,
        );
      }
      const returnedSoFar = alreadyReturned.get(item.productId) ?? 0;
      const maxReturnable = Number(invoiceItem.quantity) - returnedSoFar;
      if (item.quantity > maxReturnable) {
        throw new BadRequestException(
          `Cannot return ${item.quantity} of "${invoiceItem.productName}" (max returnable: ${maxReturnable})`,
        );
      }

      const unitPrice = Number(invoiceItem.unitPrice);
      const gstRate = Number(invoiceItem.gstRate);
      const lineSubtotal = unitPrice * item.quantity;
      const taxAmount = Math.round(lineSubtotal * (gstRate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + taxAmount;

      return {
        productId: invoiceItem.productId,
        productName: invoiceItem.productName,
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
    const grandTotal = subtotal + taxTotal;

    const returnCount = await this.prisma.salesReturn.count({
      where: { businessId },
    });
    const returnNumber = `CN-${String(returnCount + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.create({
        data: {
          businessId,
          salesInvoiceId: id,
          customerId: invoice.customerId,
          returnNumber,
          subtotal,
          taxTotal,
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
        include: { items: true },
      });

      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { increment: item.quantity } },
        });
      }

      return salesReturn;
    });
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
          returns: { include: { items: true }, orderBy: { returnDate: 'desc' } },
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

    let branchId: string;
    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, businessId },
      });
      if (!branch) {
        throw new BadRequestException('Branch not found');
      }
      branchId = branch.id;
    } else {
      branchId = (await this.branchesService.getOrCreateDefaultBranch(businessId)).id;
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
          branchId,
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
        include: { items: true, customer: true, branch: true },
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
