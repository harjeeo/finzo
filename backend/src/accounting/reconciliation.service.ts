import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  /** Bank/cash accounts eligible for reconciliation. */
  listBankAccounts(businessId: string) {
    return this.prisma.account.findMany({
      where: { businessId, isBankAccount: true },
      orderBy: [{ code: 'asc' }],
    });
  }

  async getReconciliation(businessId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, businessId },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (!account.isBankAccount) {
      throw new BadRequestException('This account is not marked as a bank account');
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: { accountId, journalEntry: { businessId } },
      include: { journalEntry: true },
      orderBy: [{ journalEntry: { entryDate: 'asc' } }, { journalEntry: { createdAt: 'asc' } }],
    });

    const isDebitNormal = account.type === 'ASSET' || account.type === 'EXPENSE';
    let bookBalance = Number(account.openingBalance);
    let reconciledBalance = Number(account.openingBalance);
    const entries = lines.map((line) => {
      const debit = Number(line.debit);
      const credit = Number(line.credit);
      const delta = isDebitNormal ? debit - credit : credit - debit;
      bookBalance += delta;
      if (line.isReconciled) {
        reconciledBalance += delta;
      }
      return {
        id: line.id,
        journalEntryId: line.journalEntryId,
        entryNumber: line.journalEntry.entryNumber,
        entryDate: line.journalEntry.entryDate,
        narration: line.journalEntry.narration,
        description: line.description,
        debit,
        credit,
        isReconciled: line.isReconciled,
        reconciledAt: line.reconciledAt,
      };
    });

    return {
      account,
      openingBalance: Number(account.openingBalance),
      bookBalance,
      reconciledBalance,
      entries,
    };
  }

  async setReconciled(
    businessId: string,
    accountId: string,
    lineId: string,
    reconciled: boolean,
  ) {
    const line = await this.prisma.journalEntryLine.findFirst({
      where: { id: lineId, accountId, journalEntry: { businessId } },
    });
    if (!line) {
      throw new NotFoundException('Journal entry line not found for this account');
    }
    return this.prisma.journalEntryLine.update({
      where: { id: lineId },
      data: {
        isReconciled: reconciled,
        reconciledAt: reconciled ? new Date() : null,
      },
    });
  }
}
