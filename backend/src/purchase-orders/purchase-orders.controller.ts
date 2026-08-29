import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderStatusDto } from './dto/update-purchase-order-status.dto.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.purchaseOrdersService.findAll(businessId, branchId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.purchaseOrdersService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.purchaseOrdersService.create(businessId, dto, actor);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.purchaseOrdersService.updateStatus(businessId, id, dto, actor);
  }

  @Post(':id/convert')
  convertToBill(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.purchaseOrdersService.convertToBill(businessId, id, actor);
  }

  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.purchaseOrdersService.remove(businessId, id, actor);
  }
}
