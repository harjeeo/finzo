import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { InventoryController } from './inventory.controller.js';
import { StockService } from './stock.service.js';
import { StockTransferService } from './stock-transfer.service.js';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InventoryController],
  providers: [StockService, StockTransferService],
  exports: [StockService],
})
export class InventoryModule {}
