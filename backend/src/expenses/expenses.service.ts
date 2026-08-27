import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { BranchesService } from '../branches/branches.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
  ) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.expense.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: { branch: true },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, businessId },
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async create(businessId: string, dto: CreateExpenseDto) {
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

    return this.prisma.expense.create({
      data: {
        ...dto,
        branchId,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        businessId,
      },
    });
  }

  async update(businessId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(businessId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
      },
    });
  }

  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);
    await this.prisma.expense.delete({ where: { id } });
    return { success: true };
  }
}
