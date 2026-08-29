import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { SuppliersModule } from './suppliers/suppliers.module.js';
import { ProductsModule } from './products/products.module.js';
import { SalesModule } from './sales/sales.module.js';
import { PurchasesModule } from './purchases/purchases.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { BusinessModule } from './business/business.module.js';
import { StaffModule } from './staff/staff.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { AccountingModule } from './accounting/accounting.module.js';
import { SuperAdminModule } from './super-admin/super-admin.module.js';
import { AuditModule } from './audit/audit.module.js';
import { EwayBillModule } from './eway-bill/eway-bill.module.js';
import { GodownsModule } from './godowns/godowns.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { QuotationsModule } from './quotations/quotations.module.js';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module.js';
import { DeliveryChallansModule } from './delivery-challans/delivery-challans.module.js';
import { PriceListsModule } from './price-lists/price-lists.module.js';
import { DiscountSchemesModule } from './discount-schemes/discount-schemes.module.js';
import { PricingModule } from './pricing/pricing.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    SuppliersModule,
    ProductsModule,
    SalesModule,
    PurchasesModule,
    ExpensesModule,
    DashboardModule,
    ReportsModule,
    BusinessModule,
    StaffModule,
    BranchesModule,
    AccountingModule,
    SuperAdminModule,
    AuditModule,
    EwayBillModule,
    GodownsModule,
    InventoryModule,
    QuotationsModule,
    PurchaseOrdersModule,
    DeliveryChallansModule,
    PriceListsModule,
    DiscountSchemesModule,
    PricingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
