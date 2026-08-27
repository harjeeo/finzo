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
import { SuppliersService } from './suppliers.service.js';
import { CreateSupplierDto } from './dto/create-supplier.dto.js';
import { UpdateSupplierDto } from './dto/update-supplier.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.suppliersService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.suppliersService.findOne(businessId, id);
  }

  @Get(':id/ledger')
  getLedger(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.suppliersService.getLedger(businessId, id);
  }

  @Roles('MANAGER')
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateSupplierDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.suppliersService.create(businessId, dto, actor);
  }

  @Roles('MANAGER')
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.suppliersService.update(businessId, id, dto, actor);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.suppliersService.remove(businessId, id, actor);
  }
}
