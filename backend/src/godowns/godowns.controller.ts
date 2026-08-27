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
import { GodownsService } from './godowns.service.js';
import { CreateGodownDto } from './dto/create-godown.dto.js';
import { UpdateGodownDto } from './dto/update-godown.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('godowns')
export class GodownsController {
  constructor(private readonly godownsService: GodownsService) {}

  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.godownsService.findAll(businessId, branchId);
  }

  @Roles('MANAGER')
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateGodownDto,
  ) {
    return this.godownsService.create(businessId, dto);
  }

  @Roles('MANAGER')
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGodownDto,
  ) {
    return this.godownsService.update(businessId, id, dto);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.godownsService.remove(businessId, id);
  }
}
