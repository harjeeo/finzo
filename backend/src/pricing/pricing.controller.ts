import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { PricingService } from './pricing.service.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('resolve')
  resolve(
    @CurrentBusinessId() businessId: string,
    @Query('productId') productId: string,
    @Query('customerId') customerId?: string,
    @Query('quantity') quantity?: string,
  ) {
    return this.pricingService.resolve(
      businessId,
      productId,
      customerId,
      quantity ? Number(quantity) : 1,
    );
  }
}
