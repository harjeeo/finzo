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
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { DeliveryChallansService } from './delivery-challans.service.js';
import { CreateDeliveryChallanDto } from './dto/create-delivery-challan.dto.js';
import { UpdateDeliveryChallanStatusDto } from './dto/update-delivery-challan-status.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery-challans')
export class DeliveryChallansController {
  constructor(private readonly deliveryChallansService: DeliveryChallansService) {}

  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.deliveryChallansService.findAll(businessId, branchId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.deliveryChallansService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateDeliveryChallanDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.deliveryChallansService.create(businessId, dto, actor);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryChallanStatusDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.deliveryChallansService.updateStatus(businessId, id, dto, actor);
  }

  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.deliveryChallansService.remove(businessId, id, actor);
  }
}
