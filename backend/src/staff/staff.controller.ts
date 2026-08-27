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
import { StaffService } from './staff.service.js';
import { CreateStaffDto } from './dto/create-staff.dto.js';
import { UpdateStaffDto } from './dto/update-staff.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Roles('MANAGER')
  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.staffService.findAll(businessId);
  }

  @Roles()
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateStaffDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.staffService.create(businessId, dto, actor);
  }

  @Roles()
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.staffService.update(businessId, id, dto, actor);
  }

  @Roles()
  @Delete(':id')
  remove(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.staffService.remove(businessId, id, actor);
  }
}
