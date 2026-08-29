import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { SalesService } from '../sales/sales.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateQuotationDto } from './dto/create-quotation.dto.js';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto.js';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly salesService: SalesService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.quotation.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: { customer: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        branch: true,
        items: true,
        convertedInvoice: { select: { id: true, invoiceNumber: true } },
      },
    });
    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }
    return quotation;
  }

  async create(businessId: string, dto: CreateQuotationDto, actor: JwtPayload) {
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
      if (!productMap.has(item.productId)) {
        throw new BadRequestException(`Product ${item.productId} not found`);
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

    const quotationCount = await this.prisma.quotation.count({ where: { businessId } });
    const quotationNumber = `QTN-${String(quotationCount + 1).padStart(6, '0')}`;

    const quotation = await this.prisma.quotation.create({
      data: {
        businessId,
        branchId,
        customerId: dto.customerId,
        quotationNumber,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
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
      include: { items: true, customer: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Quotation',
      entityId: quotation.id,
      action: 'CREATE',
      summary: `Created quotation ${quotationNumber} for ₹${grandTotal.toFixed(2)}`,
      changes: { after: quotation },
    });

    return quotation;
  }

  async updateStatus(
    businessId: string,
    id: string,
    dto: UpdateQuotationStatusDto,
    actor: JwtPayload,
  ) {
    const quotation = await this.findOne(businessId, id);
    if (quotation.status === 'CONVERTED') {
      throw new BadRequestException(
        'This quotation has already been converted to an invoice',
      );
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true, customer: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Quotation',
      entityId: id,
      action: 'UPDATE',
      summary: `Marked quotation ${quotation.quotationNumber} as ${dto.status}`,
      changes: { before: { status: quotation.status }, after: { status: updated.status } },
    });

    return updated;
  }

  async convertToInvoice(businessId: string, id: string, actor: JwtPayload) {
    const quotation = await this.findOne(businessId, id);
    if (quotation.status === 'CONVERTED') {
      throw new BadRequestException(
        'This quotation has already been converted to an invoice',
      );
    }
    if (quotation.status === 'REJECTED' || quotation.status === 'EXPIRED') {
      throw new BadRequestException(
        `Cannot convert a ${quotation.status.toLowerCase()} quotation`,
      );
    }

    const invoice = await this.salesService.create(
      businessId,
      {
        customerId: quotation.customerId,
        branchId: quotation.branchId ?? undefined,
        discountTotal: Number(quotation.discountTotal),
        items: quotation.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      },
      actor,
    );

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'CONVERTED', convertedInvoiceId: invoice.id },
      include: { items: true, customer: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Quotation',
      entityId: id,
      action: 'UPDATE',
      summary: `Converted quotation ${quotation.quotationNumber} to invoice ${invoice.invoiceNumber}`,
      changes: { after: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber } },
    });

    return { quotation: updated, invoice };
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const quotation = await this.findOne(businessId, id);
    if (quotation.status === 'CONVERTED') {
      throw new BadRequestException('Cannot delete a converted quotation');
    }
    await this.prisma.quotation.delete({ where: { id } });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Quotation',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted quotation ${quotation.quotationNumber}`,
      changes: { before: quotation },
    });

    return { success: true };
  }
}
