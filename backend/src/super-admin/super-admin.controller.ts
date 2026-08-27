import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from './guards/super-admin.guard.js';
import { SuperAdminService } from './super-admin.service.js';
import { UpdateBusinessStatusDto } from './dto/update-business-status.dto.js';

@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  getStats() {
    return this.superAdminService.getStats();
  }

  @Get('businesses')
  findAllBusinesses() {
    return this.superAdminService.findAllBusinesses();
  }

  @Get('businesses/:id')
  findOneBusiness(@Param('id') id: string) {
    return this.superAdminService.findOneBusiness(id);
  }

  @Patch('businesses/:id/status')
  updateBusinessStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.superAdminService.updateBusinessStatus(id, dto);
  }
}
