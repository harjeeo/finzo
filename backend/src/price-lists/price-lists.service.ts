import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreatePriceListDto } from './dto/create-price-list.dto.js';
import { UpdatePriceListDto } from './dto/update-price-list.dto.js';
import { SetPriceListItemDto } from './dto/set-price-list-item.dto.js';

@Injectable()
export class PriceListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string) {
    return this.prisma.priceList.findMany({
      where: { businessId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const priceList = await this.prisma.priceList.findFirst({
      where: { id, businessId },
      include: { items: { include: { product: true } } },
    });
    if (!priceList) {
      throw new NotFoundException('Price list not found');
    }
    return priceList;
  }

  async create(businessId: string, dto: CreatePriceListDto, actor: JwtPayload) {
    const existing = await this.prisma.priceList.findFirst({
      where: { businessId, name: dto.name },
    });
    if (existing) {
      throw new BadRequestException('A price list with this name already exists');
    }

    const priceList = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.priceList.updateMany({ where: { businessId }, data: { isDefault: false } });
      }
      return tx.priceList.create({
        data: {
          businessId,
          name: dto.name,
          isDefault: dto.isDefault ?? false,
          items: dto.items
            ? { create: dto.items.map((i) => ({ productId: i.productId, price: i.price })) }
            : undefined,
        },
        include: { items: { include: { product: true } } },
      });
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PriceList',
      entityId: priceList.id,
      action: 'CREATE',
      summary: `Created price list "${priceList.name}"`,
      changes: { after: priceList },
    });
    return priceList;
  }

  async update(businessId: string, id: string, dto: UpdatePriceListDto, actor: JwtPayload) {
    const before = await this.findOne(businessId, id);

    const priceList = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.priceList.updateMany({ where: { businessId }, data: { isDefault: false } });
      }
      return tx.priceList.update({
        where: { id },
        data: {
          name: dto.name,
          isDefault: dto.isDefault,
        },
        include: { items: { include: { product: true } } },
      });
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PriceList',
      entityId: id,
      action: 'UPDATE',
      summary: `Updated price list "${priceList.name}"`,
      changes: { before, after: priceList },
    });
    return priceList;
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const priceList = await this.findOne(businessId, id);
    const customerCount = await this.prisma.customer.count({ where: { priceListId: id } });
    if (customerCount > 0) {
      throw new BadRequestException(
        `Cannot delete this price list — ${customerCount} customer(s) are assigned to it`,
      );
    }
    await this.prisma.priceList.delete({ where: { id } });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'PriceList',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted price list "${priceList.name}"`,
      changes: { before: priceList },
    });
    return { success: true };
  }

  async setItem(
    businessId: string,
    priceListId: string,
    productId: string,
    dto: SetPriceListItemDto,
  ) {
    await this.findOne(businessId, priceListId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }
    return this.prisma.priceListItem.upsert({
      where: { priceListId_productId: { priceListId, productId } },
      create: { priceListId, productId, price: dto.price },
      update: { price: dto.price },
      include: { product: true },
    });
  }

  async removeItem(businessId: string, priceListId: string, productId: string) {
    await this.findOne(businessId, priceListId);
    await this.prisma.priceListItem.deleteMany({ where: { priceListId, productId } });
    return { success: true };
  }
}
