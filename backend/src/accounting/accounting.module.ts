import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';
import { JournalController } from './journal.controller.js';
import { JournalService } from './journal.service.js';
import { ReconciliationController } from './reconciliation.controller.js';
import { ReconciliationService } from './reconciliation.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [AccountsController, JournalController, ReconciliationController],
  providers: [AccountsService, JournalService, ReconciliationService],
  exports: [AccountsService, JournalService],
})
export class AccountingModule {}
