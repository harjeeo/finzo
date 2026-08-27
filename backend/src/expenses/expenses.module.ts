import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BranchesModule } from '../branches/branches.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  imports: [AuthModule, BranchesModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
