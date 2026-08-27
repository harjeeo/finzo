import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string) {
    return this.prisma.branch.findMany({
      where: { businessId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(businessId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, businessId },
    });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  create(businessId: string, dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: { ...dto, businessId },
    });
  }

  async update(businessId: string, id: string, dto: UpdateBranchDto) {
    await this.findOne(businessId, id);
    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: string, id: string) {
    const branch = await this.findOne(businessId, id);
    if (branch.isDefault) {
      throw new BadRequestException('The default branch cannot be removed');
    }
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }

  /** Ensures a business always has a default branch; creates "Main Branch" if none exists yet. */
  async getOrCreateDefaultBranch(businessId: string) {
    const existing = await this.prisma.branch.findFirst({
      where: { businessId, isDefault: true },
    });
    if (existing) {
      return existing;
    }
    return this.prisma.branch.create({
      data: { businessId, name: 'Main Branch', isDefault: true },
    });
  }
}
