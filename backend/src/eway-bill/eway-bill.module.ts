import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { EwayBillController } from './eway-bill.controller.js';
import { EwayBillService } from './eway-bill.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [EwayBillController],
  providers: [EwayBillService],
})
export class EwayBillModule {}
