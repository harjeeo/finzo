import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BranchesModule } from '../branches/branches.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { DeliveryChallansController } from './delivery-challans.controller.js';
import { DeliveryChallansService } from './delivery-challans.service.js';

@Module({
  imports: [AuthModule, BranchesModule, AuditModule],
  controllers: [DeliveryChallansController],
  providers: [DeliveryChallansService],
})
export class DeliveryChallansModule {}
