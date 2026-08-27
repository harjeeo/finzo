import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { BranchesService } from '../branches/branches.service.js';
import { AccountsService } from '../accounting/accounts.service.js';
import { JournalService } from '../accounting/journal.service.js';
import { SYSTEM_ACCOUNT_CODES, paymentModeAccountCode } from '../accounting/default-accounts.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly accountsService: AccountsService,
    private readonly journalService: JournalService,
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

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          ...dto,
          branchId,
          expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
          businessId,
        },
      });

      await this.postExpenseEntry(tx, businessId, expense);

      return expense;
    });
  }

  async update(businessId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(businessId, id);

    return this.prisma.$transaction(async (tx) => {
      const expense = await tx.expense.update({
        where: { id },
        data: {
          ...dto,
          expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        },
      });

      await tx.journalEntry.deleteMany({
        where: { businessId, sourceType: 'EXPENSE', sourceId: id },
      });
      await this.postExpenseEntry(tx, businessId, expense);

      return expense;
    });
  }

  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);
    return this.prisma.$transaction(async (tx) => {
      await tx.journalEntry.deleteMany({
        where: { businessId, sourceType: 'EXPENSE', sourceId: id },
      });
      await tx.expense.delete({ where: { id } });
      return { success: true };
    });
  }

  private async postExpenseEntry(
    tx: Prisma.TransactionClient,
    businessId: string,
    expense: { id: string; amount: unknown; paymentMode: string; category: string },
  ) {
    const [expensesAccount, cashOrBankAccount] = await Promise.all([
      this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.EXPENSES, tx),
      this.accountsService.getSystemAccount(
        businessId,
        paymentModeAccountCode(expense.paymentMode),
        tx,
      ),
    ]);
    await this.journalService.postEntry(tx, {
      businessId,
      sourceType: 'EXPENSE',
      sourceId: expense.id,
      narration: `Expense: ${expense.category}`,
      lines: [
        { accountId: expensesAccount.id, debit: Number(expense.amount) },
        { accountId: cashOrBankAccount.id, credit: Number(expense.amount) },
      ],
    });
  }
}
