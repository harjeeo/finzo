import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { ReportsService } from './reports.service.js';
import { GstrService } from './gstr.service.js';

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly gstrService: GstrService,
  ) {}

  @Get('summary')
  getSummary(
    @CurrentBusinessId() businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.reportsService.getSummary(businessId, { from, to }, branchId);
  }

  @Get('stock')
  getStockReport(@CurrentBusinessId() businessId: string) {
    return this.reportsService.getStockReport(businessId);
  }

  @Get('gstr1')
  getGstr1(
    @CurrentBusinessId() businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.gstrService.getGstr1(businessId, from, to);
  }

  @Get('gstr1/export')
  async exportGstr1(
    @CurrentBusinessId() businessId: string,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const report = await this.gstrService.getGstr1(businessId, from, to);
    const csv = this.gstrService.toCsv(report);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="GSTR1_${from ?? 'all'}_${to ?? 'all'}.csv"`,
    );
    res.send(csv);
  }

  @Get('gstr3b')
  getGstr3b(
    @CurrentBusinessId() businessId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.gstrService.getGstr3bSummary(businessId, from, to);
  }
}
