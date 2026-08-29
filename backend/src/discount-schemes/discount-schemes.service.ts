import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateDiscountSchemeDto } from './dto/create-discount-scheme.dto.js';
import { UpdateDiscountSchemeDto } from './dto/update-discount-scheme.dto.js';

@Injectable()
export class DiscountSchemesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string) {
    return this.prisma.discountScheme.findMany({
      where: { businessId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const scheme = await this.prisma.discountScheme.findFirst({
      where: { id, businessId },
      include: { product: true },
    });
    if (!scheme) {
      throw new NotFoundException('Discount scheme not found');
    }
    return scheme;
  }

  async create(businessId: string, dto: CreateDiscountSchemeDto, actor: JwtPayload) {
    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, businessId },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
    }
    if (dto.discountType === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100');
    }

    const scheme = await this.prisma.discountScheme.create({
      data: {
        businessId,
        name: dto.name,
        discountType: dto.discountType,
        value: dto.value,
        productId: dto.productId,
        minQuantity: dto.minQuantity ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive ?? true,
      },
      include: { product: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'DiscountScheme',
      entityId: scheme.id,
      action: 'CREATE',
      summary: `Created discount scheme "${scheme.name}"`,
      changes: { after: scheme },
    });
    return scheme;
  }

  async update(businessId: string, id: string, dto: UpdateDiscountSchemeDto, actor: JwtPayload) {
    const before = await this.findOne(businessId, id);
    if (dto.productId) {
      const product = await this.prisma.product.findFirst({
        where: { id: dto.productId, businessId },
      });
      if (!product) {
        throw new BadRequestException('Product not found');
      }
    }

    const scheme = await this.prisma.discountScheme.update({
      where: { id },
      data: {
        name: dto.name,
        discountType: dto.discountType,
        value: dto.value,
        productId: dto.productId,
        minQuantity: dto.minQuantity,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        isActive: dto.isActive,
      },
      include: { product: true },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'DiscountScheme',
      entityId: id,
      action: 'UPDATE',
      summary: `Updated discount scheme "${scheme.name}"`,
      changes: { before, after: scheme },
    });
    return scheme;
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const scheme = await this.findOne(businessId, id);
    await this.prisma.discountScheme.delete({ where: { id } });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'DiscountScheme',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted discount scheme "${scheme.name}"`,
      changes: { before: scheme },
    });
    return { success: true };
  }
}
