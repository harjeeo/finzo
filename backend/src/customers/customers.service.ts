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
}
