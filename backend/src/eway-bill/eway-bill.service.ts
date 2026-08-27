import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateEwayBillDto } from './dto/create-eway-bill.dto.js';
import { UpdateEwayBillDto } from './dto/update-eway-bill.dto.js';

/** Under GST rules, an E-Way Bill is required to move goods worth ₹50,000+. */
export const EWAY_BILL_THRESHOLD = 50000;

@Injectable()
export class EwayBillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** 1 day of validity per 200km of distance (simplified regular-vehicle rule), minimum 1 day. */
  private computeValidUntil(distanceKm: number, from: Date = new Date()) {
    const days = Math.max(1, Math.ceil(distanceKm / 200));
    const validUntil = new Date(from);
    validUntil.setDate(validUntil.getDate() + days);
    return validUntil;
  }

  private async findInvoiceOrThrow(businessId: string, invoiceId: string) {
    const invoice = await this.prisma.salesInvoice.findFirst({
      where: { id: invoiceId, businessId },
    });
    if (!invoice) {
      throw new NotFoundException('Sales invoice not found');
    }
    return invoice;
  }

  async findByInvoice(businessId: string, invoiceId: string) {
    await this.findInvoiceOrThrow(businessId, invoiceId);
    return this.prisma.ewayBill.findUnique({
      where: { salesInvoiceId: invoiceId },
    });
  }

  async generate(
    businessId: string,
    invoiceId: string,
    dto: CreateEwayBillDto,
    actor: JwtPayload,
  ) {
    const invoice = await this.findInvoiceOrThrow(businessId, invoiceId);
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot generate an E-Way Bill for a cancelled invoice',
      );
    }

    const existing = await this.prisma.ewayBill.findUnique({
      where: { salesInvoiceId: invoiceId },
    });
    if (existing && existing.status === 'GENERATED') {
      throw new BadRequestException(
        'An active E-Way Bill already exists for this invoice. Cancel it first to generate a new one.',
      );
    }

    const validUntil = this.computeValidUntil(dto.distanceKm);
    const data = {
      transporterName: dto.transporterName,
      transporterId: dto.transporterId,
      vehicleNumber: dto.vehicleNumber,
      transportMode: dto.transportMode ?? 'ROAD',
      distanceKm: dto.distanceKm,
      ewbNumber: dto.ewbNumber,
      validUntil,
      status: 'GENERATED' as const,
    };

    const ewayBill = existing
      ? await this.prisma.ewayBill.update({ where: { id: existing.id }, data })
      : await this.prisma.ewayBill.create({
          data: { businessId, salesInvoiceId: invoiceId, ...data },
        });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'EwayBill',
      entityId: ewayBill.id,
      action: existing ? 'UPDATE' : 'CREATE',
      summary: `Generated E-Way Bill for invoice ${invoice.invoiceNumber}`,
      changes: { after: ewayBill },
    });

    return ewayBill;
  }

  async update(
    businessId: string,
    invoiceId: string,
    dto: UpdateEwayBillDto,
    actor: JwtPayload,
  ) {
    await this.findInvoiceOrThrow(businessId, invoiceId);
    const existing = await this.prisma.ewayBill.findUnique({
      where: { salesInvoiceId: invoiceId },
    });
    if (!existing) {
      throw new NotFoundException('No E-Way Bill exists for this invoice yet');
    }

    const updated = await this.prisma.ewayBill.update({
      where: { id: existing.id },
      data: {
        ...dto,
        validUntil: dto.distanceKm
          ? this.computeValidUntil(dto.distanceKm)
          : undefined,
      },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'EwayBill',
      entityId: updated.id,
      action: 'UPDATE',
      summary: `Updated E-Way Bill ${updated.ewbNumber ?? updated.id}`,
      changes: { before: existing, after: updated },
    });

    return updated;
  }

  async cancel(businessId: string, invoiceId: string, actor: JwtPayload) {
    await this.findInvoiceOrThrow(businessId, invoiceId);
    const existing = await this.prisma.ewayBill.findUnique({
      where: { salesInvoiceId: invoiceId },
    });
    if (!existing) {
      throw new NotFoundException('No E-Way Bill exists for this invoice');
    }
    if (existing.status === 'CANCELLED') {
      throw new BadRequestException('This E-Way Bill is already cancelled');
    }

    const updated = await this.prisma.ewayBill.update({
      where: { id: existing.id },
      data: { status: 'CANCELLED' },
    });

    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'EwayBill',
      entityId: updated.id,
      action: 'UPDATE',
      summary: `Cancelled E-Way Bill ${updated.ewbNumber ?? updated.id}`,
      changes: { before: existing, after: updated },
    });

    return updated;
  }
}
