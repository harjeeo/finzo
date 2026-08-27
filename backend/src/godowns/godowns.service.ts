import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateGodownDto } from './dto/create-godown.dto.js';
import { UpdateGodownDto } from './dto/update-godown.dto.js';

@Injectable()
export class GodownsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.godown.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: { branch: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(businessId: string, id: string) {
    const godown = await this.prisma.godown.findFirst({
      where: { id, businessId },
    });
    if (!godown) {
      throw new NotFoundException('Godown not found');
    }
    return godown;
  }

  async create(businessId: string, dto: CreateGodownDto) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, businessId },
    });
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }
    return this.prisma.godown.create({
      data: { businessId, branchId: dto.branchId, name: dto.name, address: dto.address },
    });
  }

  async update(businessId: string, id: string, dto: UpdateGodownDto) {
    await this.findOne(businessId, id);
    return this.prisma.godown.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: string, id: string) {
    const godown = await this.findOne(businessId, id);
    if (godown.isDefault) {
      throw new BadRequestException('The default godown cannot be removed');
    }
    const stockCount = await this.prisma.productStock.count({
      where: { godownId: id, quantity: { gt: 0 } },
    });
    if (stockCount > 0) {
      throw new BadRequestException(
        'Cannot remove a godown that still holds stock. Transfer stock out first.',
      );
    }
    await this.prisma.godown.delete({ where: { id } });
    return { success: true };
  }

  /** Ensures a branch always has a default godown; creates "Main Godown" if none exists yet. */
  async getOrCreateDefaultGodown(
    businessId: string,
    branchId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const existing = await tx.godown.findFirst({
      where: { businessId, branchId, isDefault: true },
    });
    if (existing) {
      return existing;
    }
    return tx.godown.create({
      data: { businessId, branchId, name: 'Main Godown', isDefault: true },
    });
  }
}
