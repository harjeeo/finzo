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
import { SalesService } from './sales.service.js';
import { CreateSalesInvoiceDto } from './dto/create-sales-invoice.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-invoices')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.salesService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.salesService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateSalesInvoiceDto,
  ) {
    return this.salesService.create(businessId, dto);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.salesService.remove(businessId, id);
  }
}
