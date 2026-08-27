import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.customersService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.customersService.findOne(businessId, id);
  }

  @Get(':id/ledger')
  getLedger(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.customersService.getLedger(businessId, id);
  }

  @Roles('MANAGER', 'CASHIER')
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateCustomerDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.customersService.create(businessId, dto, actor);
  }

  @Roles('MANAGER')
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.customersService.update(businessId, id, dto, actor);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.customersService.remove(businessId, id, actor);
  }
}
