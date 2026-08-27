import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(businessId: string) {
    return this.prisma.customer.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  create(businessId: string, dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: { ...dto, businessId },
    });
  }

  async update(businessId: string, id: string, dto: UpdateCustomerDto) {
    await this.findOne(businessId, id);
    return this.prisma.customer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(businessId: string, id: string) {
    await this.findOne(businessId, id);
    await this.prisma.customer.delete({ where: { id } });
    return { success: true };
  }

  async getLedger(businessId: string, id: string) {
    const customer = await this.findOne(businessId, id);

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { businessId, customerId: id, status: { not: 'CANCELLED' } },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        grandTotal: true,
      },
    });

    const payments = await this.prisma.salesPayment.findMany({
      where: { salesInvoice: { businessId, customerId: id } },
      select: {
        id: true,
        amount: true,
        paymentDate: true,
        paymentMode: true,
        salesInvoice: { select: { invoiceNumber: true } },
      },
    });

    const returns = await this.prisma.salesReturn.findMany({
      where: { businessId, customerId: id },
      select: {
        id: true,
        returnNumber: true,
        returnDate: true,
        grandTotal: true,
      },
    });

    type Entry = {
      date: Date;
      type: 'INVOICE' | 'PAYMENT' | 'RETURN';
      reference: string;
      debit: number;
      credit: number;
    };

    const entries: Entry[] = [
      ...invoices.map((inv) => ({
        date: inv.invoiceDate,
        type: 'INVOICE' as const,
        reference: inv.invoiceNumber,
        debit: Number(inv.grandTotal),
        credit: 0,
      })),
      ...payments.map((p) => ({
        date: p.paymentDate,
        type: 'PAYMENT' as const,
        reference: `${p.salesInvoice.invoiceNumber} · ${p.paymentMode}`,
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

    let balance = Number(customer.openingBalance);
    const transactions = entries.map((entry) => {
      balance += entry.debit - entry.credit;
      return { ...entry, balance };
    });

    return {
      customer,
      openingBalance: Number(customer.openingBalance),
      transactions,
      outstandingBalance: balance,
    };
  }
}
