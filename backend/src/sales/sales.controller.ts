import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { SalesService } from './sales.service.js';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-invoices')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.salesService.findAll(businessId, branchId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.salesService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateSalesInvoiceDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.salesService.create(businessId, dto, actor);
  }

  @Post(':id/payments')
  addPayment(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.salesService.addPayment(businessId, id, dto);
  }

  @Roles('MANAGER')
  @Post(':id/returns')
  createReturn(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: CreateSalesReturnDto,
  ) {
    return this.salesService.createReturn(businessId, id, dto);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.salesService.remove(businessId, id, actor);
  }
}
