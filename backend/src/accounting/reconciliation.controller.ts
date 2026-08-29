import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { CurrentBusinessId } from '../common/decorators/current-business-id.decorator.js';
import { ReconciliationService } from './reconciliation.service.js';

class SetReconciledDto {
  @IsBoolean()
  reconciled: boolean;
}

@Roles('MANAGER', 'ACCOUNTANT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Get('accounts')
  listBankAccounts(@CurrentBusinessId() businessId: string) {
    return this.reconciliationService.listBankAccounts(businessId);
  }

  @Get(':accountId')
  getReconciliation(
    @CurrentBusinessId() businessId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.reconciliationService.getReconciliation(businessId, accountId);
  }

  @Patch(':accountId/lines/:lineId')
  setReconciled(
    @CurrentBusinessId() businessId: string,
    @Param('accountId') accountId: string,
    @Param('lineId') lineId: string,
    @Body() dto: SetReconciledDto,
  ) {
    return this.reconciliationService.setReconciled(
      businessId,
      accountId,
      lineId,
      dto.reconciled,
    );
  }
}
