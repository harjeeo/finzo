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

  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.purchasesService.remove(businessId, id);
  }
}
