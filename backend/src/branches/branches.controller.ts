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
import { BranchesService } from './branches.service.js';
import { CreateBranchDto } from './dto/create-branch.dto.js';
import { UpdateBranchDto } from './dto/update-branch.dto.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.branchesService.findAll(businessId);
  }

  @Roles('MANAGER')
  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branchesService.create(businessId, dto);
  }

  @Roles('MANAGER')
  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(businessId, id, dto);
  }

  @Roles('MANAGER')
  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.branchesService.remove(businessId, id);
  }
}
