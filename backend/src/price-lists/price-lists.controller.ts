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
import { PriceListsService } from './price-lists.service.js';
import { CreatePriceListDto } from './dto/create-price-list.dto.js';
import { UpdatePriceListDto } from './dto/update-price-list.dto.js';
import { SetPriceListItemDto } from './dto/set-price-list-item.dto.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('price-lists')
export class PriceListsController {
  constructor(private readonly priceListsService: PriceListsService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.priceListsService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.priceListsService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreatePriceListDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.priceListsService.create(businessId, dto, actor);
  }

  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePriceListDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.priceListsService.update(businessId, id, dto, actor);
  }

  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.priceListsService.remove(businessId, id, actor);
  }

  @Post(':id/items/:productId')
  setItem(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body() dto: SetPriceListItemDto,
  ) {
    return this.priceListsService.setItem(businessId, id, productId, dto);
  }

  @Delete(':id/items/:productId')
  removeItem(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.priceListsService.removeItem(businessId, id, productId);
  }
}
