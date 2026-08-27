import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

@Injectable()
export class BusinessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findOne(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return business;
  }

  async update(businessId: string, dto: UpdateBusinessDto, actor: JwtPayload) {
    const before = await this.findOne(businessId);
    const after = await this.prisma.business.update({
      where: { id: businessId },
      data: dto,
    });
    await this.auditService.log({
      businessId,
      userId: actor.sub,
      userEmail: actor.email,
      entityType: 'Business',
      entityId: businessId,
      action: 'UPDATE',
      summary: 'Updated business settings',
      changes: { before, after },
    });
    return after;
  }
}
