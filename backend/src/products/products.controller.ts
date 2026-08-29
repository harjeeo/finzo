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
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateProductUnitDto } from './dto/create-product-unit.dto.js';
import { UpdateProductUnitDto } from './dto/update-product-unit.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.productsService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.productsService.findOne(businessId, id);
  }

  @Roles('MANAGER')
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.productsService.create(businessId, dto, actor);
  }

  @Roles('MANAGER')
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.productsService.update(businessId, id, dto, actor);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.productsService.remove(businessId, id, actor);
  }

  @Get(':id/units')
  listUnits(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.productsService.listUnits(businessId, id);
  }

  @Roles('MANAGER')
  @Post(':id/units')
  createUnit(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: CreateProductUnitDto,
  ) {
    return this.productsService.createUnit(businessId, id, dto);
  }

  @Roles('MANAGER')
  @Patch(':id/units/:unitId')
  updateUnit(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Param('unitId') unitId: string,
    @Body() dto: UpdateProductUnitDto,
  ) {
    return this.productsService.updateUnit(businessId, id, unitId, dto);
  }

  @Roles('MANAGER')
  @Delete(':id/units/:unitId')
  removeUnit(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Param('unitId') unitId: string,
  ) {
    return this.productsService.removeUnit(businessId, id, unitId);
  }
}
