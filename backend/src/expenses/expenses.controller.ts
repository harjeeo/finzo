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
import { ExpensesService } from './expenses.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @CurrentBusinessId() businessId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.expensesService.findAll(businessId, branchId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.expensesService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.create(businessId, dto);
  }

  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(businessId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.expensesService.remove(businessId, id);
  }
}
