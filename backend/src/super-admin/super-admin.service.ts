import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto.js';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      businessCount,
      activeBusinessCount,
      suspendedBusinessCount,
      userCount,
      newBusinessesThisMonth,
      salesAgg,
    ] = await Promise.all([
      this.prisma.business.count(),
      this.prisma.business.count({ where: { status: 'ACTIVE' } }),
      this.prisma.business.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.user.count(),
      this.prisma.business.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.salesInvoice.aggregate({
        where: { createdAt: { gte: startOfMonth } },
        _sum: { grandTotal: true },
        _count: true,
      }),
    ]);

    return {
      businessCount,
      activeBusinessCount,
      suspendedBusinessCount,
      userCount,
      newBusinessesThisMonth,
      salesThisMonth: {
        total: Number(salesAgg._sum.grandTotal ?? 0),
        count: salesAgg._count,
      },
    };
  }

  async findAllBusinesses() {
    const businesses = await this.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          where: { role: 'OWNER' },
          include: { user: { select: { name: true, email: true } } },
          take: 1,
        },
        _count: {
          select: {
            memberships: true,
            salesInvoices: true,
            purchaseBills: true,
          },
        },
      },
    });

    return businesses.map((b) => ({
      id: b.id,
      name: b.name,
      gstin: b.gstin,
      city: b.city,
      state: b.state,
      status: b.status,
      createdAt: b.createdAt,
      owner: b.memberships[0]?.user ?? null,
      memberCount: b._count.memberships,
      salesInvoiceCount: b._count.salesInvoices,
      purchaseBillCount: b._count.purchaseBills,
    }));
  }

  async findOneBusiness(id: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: {
        memberships: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const [salesAgg, purchaseAgg, customerCount, productCount] = await Promise.all([
      this.prisma.salesInvoice.aggregate({
        where: { businessId: id },
        _sum: { grandTotal: true },
        _count: true,
      }),
      this.prisma.purchaseBill.aggregate({
        where: { businessId: id },
        _sum: { grandTotal: true },
        _count: true,
      }),
      this.prisma.customer.count({ where: { businessId: id } }),
      this.prisma.product.count({ where: { businessId: id } }),
    ]);

    return {
      id: business.id,
      name: business.name,
      gstin: business.gstin,
      pan: business.pan,
      address: business.address,
      city: business.city,
      state: business.state,
      pincode: business.pincode,
      status: business.status,
      createdAt: business.createdAt,
      members: business.memberships.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
      })),
      stats: {
        totalSales: Number(salesAgg._sum.grandTotal ?? 0),
        salesInvoiceCount: salesAgg._count,
        totalPurchases: Number(purchaseAgg._sum.grandTotal ?? 0),
        purchaseBillCount: purchaseAgg._count,
        customerCount,
        productCount,
      },
    };
  }

  async updateBusinessStatus(id: string, dto: UpdateBusinessStatusDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    return this.prisma.business.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
