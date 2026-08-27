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
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(@CurrentBusinessId() businessId: string) {
    return this.customersService.findAll(businessId);
  }

  @Get(':id')
  findOne(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.customersService.findOne(businessId, id);
  }

  @Post()
  create(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(businessId, dto);
  }

  @Patch(':id')
  update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(businessId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentBusinessId() businessId: string, @Param('id') id: string) {
    return this.customersService.remove(businessId, id);
  }
}
