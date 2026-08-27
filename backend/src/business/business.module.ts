import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { BusinessController } from './business.controller.js';
import { BusinessService } from './business.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [BusinessController],
  providers: [BusinessService],
})
export class BusinessModule {}
