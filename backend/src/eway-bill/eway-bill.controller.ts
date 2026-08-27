import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { EwayBillService } from './eway-bill.service.js';
import { CreateEwayBillDto } from './dto/create-eway-bill.dto.js';
import { UpdateEwayBillDto } from './dto/update-eway-bill.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-invoices/:invoiceId/eway-bill')
export class EwayBillController {
  constructor(private readonly ewayBillService: EwayBillService) {}

  @Get()
  findOne(
    @CurrentBusinessId() businessId: string,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.ewayBillService.findByInvoice(businessId, invoiceId);
  }

  @Roles('MANAGER', 'ACCOUNTANT', 'CASHIER')
  @Post()
  generate(
    @CurrentBusinessId() businessId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreateEwayBillDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.ewayBillService.generate(businessId, invoiceId, dto, actor);
  }

  @Roles('MANAGER', 'ACCOUNTANT', 'CASHIER')
  @Patch()
  update(
    @CurrentBusinessId() businessId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: UpdateEwayBillDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.ewayBillService.update(businessId, invoiceId, dto, actor);
  }

  @Roles('MANAGER', 'ACCOUNTANT')
  @Post('cancel')
  cancel(
    @CurrentBusinessId() businessId: string,
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.ewayBillService.cancel(businessId, invoiceId, actor);
  }
}
