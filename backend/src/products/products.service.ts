import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { GodownsService } from '../godowns/godowns.service.js';
import { StockService } from '../inventory/stock.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductUnitDto } from './dto/create-product-unit.dto.js';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto.js';

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
      include: { units: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId },
      include: { units: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async listUnits(businessId: string, productId: string) {
    await this.findOne(businessId, productId);
    return this.prisma.productUnit.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createUnit(businessId: string, productId: string, dto: CreateProductUnitDto) {
    const product = await this.findOne(businessId, productId);
    if (dto.name.trim().toLowerCase() === product.unit.trim().toLowerCase()) {
      throw new BadRequestException(
        `"${dto.name}" is already this product's base unit`,
      );
    }
    const existing = await this.prisma.productUnit.findFirst({
      where: { productId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('A unit with this name already exists for this product');
    }
    return this.prisma.productUnit.create({
      data: { productId, name: dto.name, conversionFactor: dto.conversionFactor },
    });
  }

  async updateUnit(
    businessId: string,
    productId: string,
    unitId: string,
    dto: UpdateProductUnitDto,
  ) {
    await this.findOne(businessId, productId);
    const unit = await this.prisma.productUnit.findFirst({
      where: { id: unitId, productId },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return this.prisma.productUnit.update({ where: { id: unitId }, data: dto });
  }

  async removeUnit(businessId: string, productId: string, unitId: string) {
    await this.findOne(businessId, productId);
    const unit = await this.prisma.productUnit.findFirst({
      where: { id: unitId, productId },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    await this.prisma.productUnit.delete({ where: { id: unitId } });
    return { success: true };
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
