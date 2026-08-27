import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AuditModule } from '../audit/audit.module.js';
import { BranchesModule } from '../branches/branches.module.js';
import { GodownsModule } from '../godowns/godowns.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

@Module({
  imports: [AuthModule, AuditModule, BranchesModule, GodownsModule, InventoryModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
