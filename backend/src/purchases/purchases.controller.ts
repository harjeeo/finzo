import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { PurchasesService } from './purchases.service.js';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-bills')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.purchasesService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.purchasesService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreatePurchaseBillDto,
  ) {
    return this.purchasesService.create(businessId, dto);
  }

  @Post(':id/payments')
  addPayment(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.purchasesService.addPayment(businessId, id, dto);
  }

  @Post(':id/returns')
  createReturn(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchasesService.createReturn(businessId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.purchasesService.remove(businessId, id);
  }
}
