import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BranchesModule } from '../branches/branches.module.js';
import { AccountingModule } from '../accounting/accounting.module.js';
import { SalesController } from './sales.controller.js';
import { SalesService } from './sales.service.js';

@Module({
  imports: [AuthModule, BranchesModule, AccountingModule],
  controllers: [SalesController],
  providers: [SalesService],
})
export class SalesModule {}
