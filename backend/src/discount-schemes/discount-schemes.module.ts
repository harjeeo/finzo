import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { DiscountSchemesController } from './discount-schemes.controller.js';
import { DiscountSchemesService } from './discount-schemes.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [DiscountSchemesController],
  providers: [DiscountSchemesService],
})
export class DiscountSchemesModule {}
