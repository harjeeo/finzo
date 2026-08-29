import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string) {
    return this.prisma.customer.findMany({
      where: { businessId },
      include: { priceList: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId },
      include: { priceList: true },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async create(businessId: string, dto: CreateCustomerDto, actor: JwtPayload) {
    const customer = await this.prisma.customer.create({
      data: { ...dto, priceListId: dto.priceListId || null, businessId },
    });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Customer',
      entityId: customer.id,
      action: 'CREATE',
      summary: `Created customer "${customer.name}"`,
      changes: { after: customer },
    });
    return customer;
  }

  async update(
    businessId: string,
    id: string,
    dto: UpdateCustomerDto,
    actor: JwtPayload,
  ) {
    const before = await this.findOne(businessId, id);
    const after = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.priceListId !== undefined ? { priceListId: dto.priceListId || null } : {}),
      },
    });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Customer',
      entityId: id,
      action: 'UPDATE',
      summary: `Updated customer "${after.name}"`,
      changes: { before, after },
    });
    return after;
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const customer = await this.findOne(businessId, id);
    await this.prisma.customer.delete({ where: { id } });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Customer',
      entityId: id,
      action: 'DELETE',
      summary: `Deleted customer "${customer.name}"`,
      changes: { before: customer },
    });
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
