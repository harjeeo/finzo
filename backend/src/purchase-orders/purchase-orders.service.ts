import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { PurchasesService } from '../purchases/purchases.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto.js';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly purchasesService: PurchasesService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: { supplier: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, businessId },
      include: {
        supplier: true,
        branch: true,
        items: true,
        convertedBill: { select: { id: true, billNumber: true } },
      },
    });
    if (!po) {
      throw new NotFoundException('Purchase order not found');
    }
    return po;
  }

  async create(businessId: string, dto: CreatePurchaseOrderDto, actor: JwtPayload) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, businessId },
    });
    if (!supplier) {
      throw new BadRequestException('Supplier not found');
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

    const poCount = await this.prisma.purchaseOrder.count({ where: { businessId } });
    const poNumber = `PO-${String(poCount + 1).padStart(6, '0')}`;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        businessId,
        branchId,
        supplierId: dto.supplierId,
        poNumber,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
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
      include: { items: true, supplier: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PurchaseOrder',
      entityId: po.id,
      action: 'CREATE',
      summary: `Created purchase order ${poNumber} for ₹${grandTotal.toFixed(2)}`,
      changes: { after: po },
    });

    return po;
  }

  async updateStatus(
    businessId: string,
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
    actor: JwtPayload,
  ) {
    const po = await this.findOne(businessId, id);
    if (po.status === 'CONVERTED') {
      throw new BadRequestException(
        'This purchase order has already been converted to a bill',
      );
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true, supplier: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PurchaseOrder',
      entityId: id,
      action: 'UPDATE',
      summary: `Marked purchase order ${po.poNumber} as ${dto.status}`,
      changes: { before: { status: po.status }, after: { status: updated.status } },
    });

    return updated;
  }

  async convertToBill(businessId: string, id: string, actor: JwtPayload) {
    const po = await this.findOne(businessId, id);
    if (po.status === 'CONVERTED') {
      throw new BadRequestException(
        'This purchase order has already been converted to a bill',
      );
    }
    if (po.status === 'CANCELLED') {
      throw new BadRequestException('Cannot convert a cancelled purchase order');
    }

    const bill = await this.purchasesService.create(
      businessId,
      {
        supplierId: po.supplierId,
        branchId: po.branchId ?? undefined,
        discountTotal: Number(po.discountTotal),
        items: po.items.map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      },
      actor,
    );

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CONVERTED', convertedBillId: bill.id },
      include: { items: true, supplier: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PurchaseOrder',
      entityId: id,
      action: 'UPDATE',
      summary: `Converted purchase order ${po.poNumber} to bill ${bill.billNumber}`,
      changes: { after: { billId: bill.id, billNumber: bill.billNumber } },
    });

    return { purchaseOrder: updated, bill };
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const po = await this.findOne(businessId, id);
    if (po.status === 'CONVERTED') {
      throw new BadRequestException('Cannot delete a converted purchase order');
    }
    await this.prisma.purchaseOrder.delete({ where: { id } });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PurchaseOrder',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted purchase order ${po.poNumber}`,
      changes: { before: po },
    });

    return { success: true };
  }
}
