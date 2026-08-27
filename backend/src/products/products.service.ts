import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { GodownsService } from '../godowns/godowns.service.js';
import { StockService } from '../inventory/stock.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly branchesService: BranchesService,
    private readonly godownsService: GodownsService,
    private readonly stockService: StockService,
  ) {}

  findAll(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(businessId: string, dto: CreateProductDto, actor: JwtPayload) {
    const openingStock = dto.openingStock ?? 0;

    const product = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...dto,
          openingStock,
          currentStock: 0,
          businessId,
        },
      });

      if (openingStock <= 0) {
        return created;
      }

      const defaultBranch = await this.branchesService.getOrCreateDefaultBranch(businessId);
      const defaultGodown = await this.godownsService.getOrCreateDefaultGodown(
        businessId,
        defaultBranch.id,
        tx,
      );
      await this.stockService.receiveExisting(tx, {
        businessId,
        productId: created.id,
        godownId: defaultGodown.id,
        batchId: null,
        quantity: openingStock,
        sourceType: 'ADJUSTMENT',
        sourceId: created.id,
      });

      return tx.product.findUniqueOrThrow({ where: { id: created.id } });
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Product',
      entityId: product.id,
      action: 'CREATE',
      summary: `Created product "${product.name}"`,
      changes: { after: product },
    });
    return product;
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateProductDto,
    actor: JwtPayload,
  ) {
    const before = await this.findOne(businessId, id);
    const after = await this.prisma.product.update({
      where: { id },
      data: dto,
    });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Product',
      entityId: id,
      action: 'UPDATE',
      summary: `Updated product "${after.name}"`,
      changes: { before, after },
    });
    return after;
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const product = await this.findOne(businessId, id);
    await this.prisma.product.delete({ where: { id } });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Product',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted product "${product.name}"`,
      changes: { before: product },
    });
    return { success: true };
  }
}
