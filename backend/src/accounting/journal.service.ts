import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto.js';

export interface PostLine {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface PostEntryParams {
  businessId: string;
  entryDate?: Date;
  narration?: string;
  sourceType?:
    | 'MANUAL'
    | 'SALES_INVOICE'
    | 'SALES_PAYMENT'
    | 'SALES_RETURN'
    | 'PURCHASE_BILL'
    | 'PURCHASE_PAYMENT'
    | 'PURCHASE_RETURN'
    | 'EXPENSE';
  sourceId?: string;
  lines: PostLine[];
}

const ROUNDING_TOLERANCE = 0.01;

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Posts a balanced journal entry. Pass a transaction client to compose with a parent transaction. */
  async postEntry(
    tx: Prisma.TransactionClient | PrismaService,
    params: PostEntryParams,
  ) {
    const lines = params.lines.filter(
      (l) => (l.debit ?? 0) > 0 || (l.credit ?? 0) > 0,
    );
    if (lines.length < 2) {
      throw new BadRequestException(
        'A journal entry needs at least two non-zero lines',
      );
    }
    const totalDebit = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > ROUNDING_TOLERANCE) {
      throw new BadRequestException(
        `Journal entry does not balance (debit ₹${totalDebit.toFixed(2)} vs credit ₹${totalCredit.toFixed(2)})`,
      );
    }

    const entryCount = await tx.journalEntry.count({
      where: { businessId: params.businessId },
    });
    const entryNumber = `JE-${String(entryCount + 1).padStart(6, '0')}`;

    return tx.journalEntry.create({
      data: {
        businessId: params.businessId,
        entryNumber,
        entryDate: params.entryDate ?? new Date(),
        narration: params.narration,
        sourceType: params.sourceType ?? 'MANUAL',
        sourceId: params.sourceId,
        lines: {
          create: lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit ?? 0,
            credit: l.credit ?? 0,
            description: l.description,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  /** Deletes any auto-posted journal entries linked to a given transaction source. */
  removeBySource(
    tx: Prisma.TransactionClient | PrismaService,
    businessId: string,
    sourceType: PostEntryParams['sourceType'],
    sourceId: string,
  ) {
    return tx.journalEntry.deleteMany({
      where: { businessId, sourceType, sourceId },
    });
  }

  findAll(businessId: string, from?: string, to?: string) {
    return this.prisma.journalEntry.findMany({
      where: {
        businessId,
        ...(from || to
          ? {
              entryDate: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
      include: { lines: { include: { account: true } } },
      orderBy: { entryDate: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, businessId },
      include: { lines: { include: { account: true } } },
    });
    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }
    return entry;
  }

  async createManual(businessId: string, dto: CreateJournalEntryDto) {
    const accountIds = dto.lines.map((l) => l.accountId);
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds }, businessId },
    });
    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException('One or more accounts were not found');
    }

    return this.postEntry(this.prisma, {
      businessId,
      entryDate: dto.entryDate ? new Date(dto.entryDate) : undefined,
      narration: dto.narration,
      sourceType: 'MANUAL',
      lines: dto.lines,
    });
  }

  async removeManual(businessId: string, id: string) {
    const entry = await this.findOne(businessId, id);
    if (entry.sourceType !== 'MANUAL') {
      throw new BadRequestException(
        'This entry was posted automatically from a transaction; delete or edit the source transaction instead',
      );
    }
    await this.prisma.journalEntry.delete({ where: { id } });
    return { success: true };
  }

  /** General ledger for a single account: chronological lines with a running balance. */
  async getLedger(businessId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, businessId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: { accountId, journalEntry: { businessId } },
      include: { journalEntry: true },
      orderBy: [{ journalEntry: { entryDate: 'asc' } }, { journalEntry: { createdAt: 'asc' } }],
    });

    const isDebitNormal = account.type === 'ASSET' || account.type === 'EXPENSE';
    let balance = Number(account.openingBalance);
    const entries = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      balance += isDebitNormal ? debit - credit : credit - debit;
      return {
        id: line.id,
        journalEntryId: line.journalEntryId,
        entryNumber: line.journalEntry.entryNumber,
        entryDate: line.journalEntry.entryDate,
        narration: line.journalEntry.narration,
        description: line.description,
        debit,
        credit,
        balance,
      };
    });

    return {
      account,
      openingBalance: Number(account.openingBalance),
      closingBalance: balance,
      entries,
    };
  }

  /** Trial balance: every account's total debits/credits and net balance, plus grand totals. */
  async getTrialBalance(businessId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { businessId },
      orderBy: [{ type: 'asc' }, { code: 'asc' }],
      include: { journalLines: true },
    });

    const rows = accounts.map((account) => {
      const isDebitNormal = account.type === 'ASSET' || account.type === 'EXPENSE';
      const totalDebit = account.journalLines.reduce(
        (sum, l) => sum + Number(l.debit),
        0,
      );
      const totalCredit = account.journalLines.reduce(
        (sum, l) => sum + Number(l.credit),
        0,
      );
      const balance =
        Number(account.openingBalance) +
        (isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit);

      return {
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        debit: isDebitNormal ? Math.max(balance, 0) : Math.max(-balance, 0),
        credit: isDebitNormal ? Math.max(-balance, 0) : Math.max(balance, 0),
        balance,
      };
    });

    const totalDebit = rows.reduce((sum, r) => sum + r.debit, 0);
    const totalCredit = rows.reduce((sum, r) => sum + r.credit, 0);

    return { rows, totalDebit, totalCredit };
  }
}
