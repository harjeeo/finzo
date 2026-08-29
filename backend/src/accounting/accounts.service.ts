import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { DEFAULT_ACCOUNTS } from './default-accounts.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string) {
    return this.prisma.account.findMany({
      where: { businessId },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(businessId: string, id: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, businessId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async create(businessId: string, dto: CreateAccountDto) {
    const existing = await this.prisma.account.findFirst({
      where: { businessId, code: dto.code },
    });
    if (existing) {
      throw new BadRequestException('An account with this code already exists');
    }
    return this.prisma.account.create({
      data: { ...dto, businessId },
    });
  }

  async update(businessId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.findOne(businessId, id);
    if (account.isSystem && (dto.code || dto.type)) {
      throw new BadRequestException(
        'Only the name can be changed on a system account',
      );
    }
    return this.prisma.account.update({
      where: { id },
      data: account.isSystem ? { name: dto.name } : dto,
    });
  }

  async remove(businessId: string, id: string) {
    const account = await this.findOne(businessId, id);
    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be deleted');
    }
    const lineCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });
    if (lineCount > 0) {
      throw new BadRequestException(
        'Cannot delete an account that has journal entries posted to it',
      );
    }
    await this.prisma.account.delete({ where: { id } });
    return { success: true };
  }

  /** Idempotently seeds the default Chart of Accounts for a new business. */
  async seedDefaultAccounts(
    tx: Prisma.TransactionClient,
    businessId: string,
  ) {
    await tx.account.createMany({
      data: DEFAULT_ACCOUNTS.map((a) => ({
        businessId,
        code: a.code,
        name: a.name,
        type: a.type,
        isSystem: true,
        isBankAccount: a.code === 'CASH' || a.code === 'BANK',
      })),
      skipDuplicates: true,
    });
  }

  /** Fetches a system account by code, using a transaction client when posting inside one. */
  async getSystemAccount(
    businessId: string,
    code: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const account = await tx.account.findFirst({
      where: { businessId, code },
    });
    if (!account) {
      throw new BadRequestException(
        `System account "${code}" not found for this business`,
      );
    }
    return account;
  }
}
