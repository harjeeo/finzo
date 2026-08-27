import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { StockService } from './stock.service.js';
import { StockTransferService } from './stock-transfer.service.js';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InventoryController {
  constructor(
    private readonly stockService: StockService,
    private readonly stockTransferService: StockTransferService,
  ) {}

  @Get('products/:id/stock')
  getStockByProduct(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
  ) {
    return this.stockService.getStockByProduct(businessId, id);
  }

  @Get('batches/expiry-report')
  getExpiryReport(
    @CurrentBusinessId() businessId: string,
    @Query('withinDays') withinDays?: string,
  ) {
    return this.stockService.getExpiryReport(
      businessId,
      withinDays ? Number(withinDays) : undefined,
    );
  }

  @Get('stock-transfers')
  findAllTransfers(@CurrentBusinessId() businessId: string) {
    return this.stockTransferService.findAll(businessId);
  }

  @Roles('MANAGER', 'ACCOUNTANT')
  @Post('stock-transfers')
  createTransfer(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateStockTransferDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.stockTransferService.create(businessId, dto, actor);
  }
}
