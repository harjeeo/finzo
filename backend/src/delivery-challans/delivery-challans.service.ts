import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto.js';
import { UpdateDeliveryChallanStatusDto } from './dto/update-delivery-challan-status.dto.js';

@Injectable()
export class DeliveryChallansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.deliveryChallan.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: {
        customer: true,
        branch: true,
        salesInvoice: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const challan = await this.prisma.deliveryChallan.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        branch: true,
        items: true,
        salesInvoice: { select: { id: true, invoiceNumber: true } },
      },
    });
    if (!challan) {
      throw new NotFoundException('Delivery challan not found');
    }
    return challan;
  }

  async create(businessId: string, dto: CreateDeliveryChallanDto, actor: JwtPayload) {
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

    if (dto.salesInvoiceId) {
      const invoice = await this.prisma.salesInvoice.findFirst({
        where: { id: dto.salesInvoiceId, businessId },
      });
      if (!invoice) {
        throw new BadRequestException('Sales invoice not found');
      }
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
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

    const challanCount = await this.prisma.deliveryChallan.count({ where: { businessId } });
    const challanNumber = `DC-${String(challanCount + 1).padStart(6, '0')}`;

    const challan = await this.prisma.deliveryChallan.create({
      data: {
        businessId,
        branchId,
        customerId: dto.customerId,
        salesInvoiceId: dto.salesInvoiceId,
        challanNumber,
        vehicleNumber: dto.vehicleNumber,
        transporterName: dto.transporterName,
        notes: dto.notes,
        items: {
          create: lineItems.map((li) => ({
            productId: li.productId,
            productName: li.productName,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
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
      entityType: 'DeliveryChallan',
      entityId: challan.id,
      action: 'CREATE',
      summary: `Created delivery challan ${challanNumber}`,
      changes: { after: challan },
    });

    return challan;
  }

  async updateStatus(
    businessId: string,
    id: string,
    dto: UpdateDeliveryChallanStatusDto,
    actor: JwtPayload,
  ) {
    const challan = await this.findOne(businessId, id);

    const updated = await this.prisma.deliveryChallan.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true, customer: true, branch: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'DeliveryChallan',
      entityId: id,
      action: 'UPDATE',
      summary: `Marked delivery challan ${challan.challanNumber} as ${dto.status}`,
      changes: { before: { status: challan.status }, after: { status: updated.status } },
    });

    return updated;
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const challan = await this.findOne(businessId, id);
    await this.prisma.deliveryChallan.delete({ where: { id } });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'DeliveryChallan',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted delivery challan ${challan.challanNumber}`,
      changes: { before: challan },
    });

    return { success: true };
  }
}
