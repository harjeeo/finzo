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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
