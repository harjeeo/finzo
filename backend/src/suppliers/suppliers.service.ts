import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string) {
    return this.prisma.supplier.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, businessId },
    });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  create(businessId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: { ...dto, businessId },
    });
  }

  async update(businessId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(businessId, id);
    return this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);
    await this.prisma.supplier.delete({ where: { id } });
    return { success: true };
  }

  async getLedger(businessId: string, id: string) {
    const supplier = await this.findOne(businessId, id);

    const bills = await this.prisma.purchaseBill.findMany({
      where: { businessId, supplierId: id, status: { not: 'CANCELLED' } },
      select: {
        id: true,
        billNumber: true,
        billDate: true,
        grandTotal: true,
      },
    });

    const payments = await this.prisma.purchasePayment.findMany({
      where: { purchaseBill: { businessId, supplierId: id } },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentMode: true,
        purchaseBill: { select: { billNumber: true } },
      },
    });

    const returns = await this.prisma.purchaseReturn.findMany({
      where: { businessId, supplierId: id },
      select: {
        id: true,
        returnNumber: true,
        returnDate: true,
        grandTotal: true,
      },
    });

    type Entry = {
      date: Date;
      type: 'BILL' | 'PAYMENT' | 'RETURN';
      reference: string;
      debit: number;
      credit: number;
    };

    const entries: Entry[] = [
      ...bills.map((bill) => ({
        date: bill.billDate,
        type: 'BILL' as const,
        reference: bill.billNumber,
        debit: Number(bill.grandTotal),
        credit: 0,
      })),
      ...payments.map((p) => ({
        date: p.paymentDate,
        type: 'PAYMENT' as const,
        reference: `${p.purchaseBill.billNumber} · ${p.paymentMode}`,
        debit: 0,
        credit: Number(p.amount),
      })),
      ...returns.map((ret) => ({
        date: ret.returnDate,
        type: 'RETURN' as const,
        reference: ret.returnNumber,
        debit: 0,
        credit: Number(ret.grandTotal),
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    let balance = Number(supplier.openingBalance);
    const transactions = entries.map((entry) => {
      balance += entry.debit - entry.credit;
      return { ...entry, balance };
    });

    return {
      supplier,
      openingBalance: Number(supplier.openingBalance),
      transactions,
      outstandingBalance: balance,
    };
  }
}
