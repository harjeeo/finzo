import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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

  create(businessId: string, dto: CreateProductDto) {
    const openingStock = dto.openingStock ?? 0;
    return this.prisma.product.create({
      data: {
        ...dto,
        openingStock,
        currentStock: openingStock,
        businessId,
      },
    });
  }

  async update(businessId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(businessId, id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }
}
