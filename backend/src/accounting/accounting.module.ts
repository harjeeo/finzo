import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AccountsController } from './accounts.controller.js';
import { AccountsService } from './accounts.service.js';
import { JournalController } from './journal.controller.js';
import { JournalService } from './journal.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AccountsController, JournalController],
  providers: [AccountsService, JournalService],
  exports: [AccountsService, JournalService],
})
export class AccountingModule {}
