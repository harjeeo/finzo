import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { BusinessService } from './business.service.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Get()
  findOne(@CurrentBusinessId() businessId: string) {
    return this.businessService.findOne(businessId);
  }

  @Roles()
  @Patch()
  update(
    @CurrentBusinessId() businessId: string,
    @Body() dto: UpdateBusinessDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.businessService.update(businessId, dto, actor);
  }
}
