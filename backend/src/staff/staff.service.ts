import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';

const SALT_ROUNDS = 12;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(businessId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships;
  }

  async create(businessId: string, dto: CreateStaffDto) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const existingMembership = await this.prisma.membership.findUnique({
        where: { userId_businessId: { userId: user.id, businessId } },
      });
      if (existingMembership) {
        throw new ConflictException(
          'This user is already a member of this business',
        );
      }
    } else {
      const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
      user = await this.prisma.user.create({
        data: { name: dto.name, email: dto.email, passwordHash },
      });
    }

    const membership = await this.prisma.membership.create({
      data: { userId: user.id, businessId, role: dto.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return membership;
  }

  async update(businessId: string, membershipId: string, dto: UpdateStaffDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, businessId },
    });
    if (!membership) {
      throw new NotFoundException('Staff member not found');
    }
    if (membership.role === 'OWNER') {
      throw new BadRequestException("The business owner's role can't be changed");
    }

    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(businessId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, businessId },
    });
    if (!membership) {
      throw new NotFoundException('Staff member not found');
    }
    if (membership.role === 'OWNER') {
      throw new BadRequestException('The business owner cannot be removed');
    }

    await this.prisma.membership.delete({ where: { id: membershipId } });
    return { success: true };
  }
}
