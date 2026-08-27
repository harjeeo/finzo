import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { ReportsService } from './reports.service.js';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(
    @CurrentBusinessId() businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSummary(businessId, { from, to });
  }

  @Get('stock')
  getStockReport(@CurrentBusinessId() businessId: string) {
    return this.reportsService.getStockReport(businessId);
  }
}
