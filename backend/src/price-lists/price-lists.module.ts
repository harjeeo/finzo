import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { PriceListsController } from './price-lists.controller.js';
import { PriceListsService } from './price-lists.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PriceListsController],
  providers: [PriceListsService],
})
export class PriceListsModule {}
