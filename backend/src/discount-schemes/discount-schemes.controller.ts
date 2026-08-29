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
import { DiscountSchemesService } from './discount-schemes.service.js';
import { CreateDiscountSchemeDto } from './dto/create-discount-scheme.dto.js';
import { UpdateDiscountSchemeDto } from './dto/update-discount-scheme.dto.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discount-schemes')
export class DiscountSchemesController {
  constructor(private readonly discountSchemesService: DiscountSchemesService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.discountSchemesService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.discountSchemesService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateDiscountSchemeDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.discountSchemesService.create(businessId, dto, actor);
  }

  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDiscountSchemeDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.discountSchemesService.update(businessId, id, dto, actor);
  }

  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.discountSchemesService.remove(businessId, id, actor);
  }
}
