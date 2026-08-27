import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

export interface AuditLogParams {
  businessId: string;
  userId?: string | null;
  userEmail?: string | null;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  summary?: string;
  changes?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(
    params: AuditLogParams,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return tx.auditLog.create({
      data: {
        businessId: params.businessId,
        userId: params.userId ?? undefined,
        userEmail: params.userEmail ?? undefined,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        summary: params.summary,
        changes: params.changes as Prisma.InputJsonValue | undefined,
      },
    });
  }

  findAll(
    businessId: string,
    filters: { entityType?: string; entityId?: string; from?: string; to?: string },
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        businessId,
        ...(filters.entityType ? { entityType: filters.entityType } : {}),
        ...(filters.entityId ? { entityId: filters.entityId } : {}),
        ...(filters.from || filters.to
          ? {
              createdAt: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
