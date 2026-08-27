import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { BranchesService } from '../branches/branches.service.js';
import { GodownsService } from '../godowns/godowns.service.js';
import { StockService } from '../inventory/stock.service.js';
import { AccountsService } from '../accounting/accounts.service.js';
import { JournalService, type PostLine } from '../accounting/journal.service.js';
import { SYSTEM_ACCOUNT_CODES, paymentModeAccountCode } from '../accounting/default-accounts.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreatePurchaseBillDto } from './dto/create-purchase-bill.dto.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto.js';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly branchesService: BranchesService,
    private readonly godownsService: GodownsService,
    private readonly stockService: StockService,
    private readonly accountsService: AccountsService,
    private readonly journalService: JournalService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string, branchId?: string) {
    return this.prisma.purchaseBill.findMany({
      where: { businessId, ...(branchId ? { branchId } : {}) },
      include: { supplier: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(businessId: string, id: string) {
    const bill = await this.prisma.purchaseBill.findFirst({
      where: { id, businessId },
      include: {
        supplier: true,
        branch: true,
        items: true,
        payments: { orderBy: { paymentDate: 'desc' } },
        returns: {
          include: { items: true },
          orderBy: { returnDate: 'desc' },
        },
      },
    });
    if (!bill) {
      throw new NotFoundException('Purchase bill not found');
    }
    return bill;
  }

  async createReturn(
    businessId: string,
    id: string,
    dto: CreatePurchaseReturnDto,
  ) {
    const bill = await this.findOne(businessId, id);

    if (bill.status === 'CANCELLED') {
      throw new BadRequestException('Cannot return items on a cancelled bill');
    }

    const billItemMap = new Map(bill.items.map((item) => [item.productId, item]));
    const alreadyReturned = new Map<string, number>();
    for (const ret of bill.returns) {
      for (const item of ret.items) {
        alreadyReturned.set(
          item.productId,
          (alreadyReturned.get(item.productId) ?? 0) + Number(item.quantity),
        );
      }
    }

    for (const item of dto.items) {
      const billItem = billItemMap.get(item.productId);
      if (!billItem) {
        throw new BadRequestException(
          `Product ${item.productId} was not part of this bill`,
        );
      }
      const returnedSoFar = alreadyReturned.get(item.productId) ?? 0;
      const maxReturnable = Number(billItem.quantity) - returnedSoFar;
      if (item.quantity > maxReturnable) {
        throw new BadRequestException(
          `Cannot return ${item.quantity} of "${billItem.productName}" (max returnable: ${maxReturnable})`,
        );
      }
    }

    for (const item of dto.items) {
      const product = await this.prisma.product.findUniqueOrThrow({
        where: { id: item.productId },
      });
      if (Number(product.currentStock) < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}" to return (available: ${product.currentStock})`,
        );
      }
    }

    const lineItems = dto.items.map((item) => {
      const billItem = billItemMap.get(item.productId)!;
      const unitPrice = Number(billItem.unitPrice);
      const gstRate = Number(billItem.gstRate);
      const lineSubtotal = unitPrice * item.quantity;
      const taxAmount = Math.round(lineSubtotal * (gstRate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + taxAmount;

      return {
        productId: billItem.productId,
        productName: billItem.productName,
        quantity: item.quantity,
        unitPrice,
        gstRate,
        taxAmount,
        lineTotal,
        lineSubtotal,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineSubtotal, 0);
    const taxTotal = lineItems.reduce((sum, li) => sum + li.taxAmount, 0);
    const grandTotal = subtotal + taxTotal;

    const returnCount = await this.prisma.purchaseReturn.count({
      where: { businessId },
    });
    const returnNumber = `DN-${String(returnCount + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          businessId,
          purchaseBillId: id,
          supplierId: bill.supplierId,
          returnNumber,
          subtotal,
          taxTotal,
          grandTotal,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              productName: li.productName,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              gstRate: li.gstRate,
              taxAmount: li.taxAmount,
              lineTotal: li.lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      const returnGodownId = await this.resolveBillGodownId(tx, businessId, bill);
      for (const item of dto.items) {
        const billItem = billItemMap.get(item.productId)!;
        const batchId = billItem.batchNumber
          ? (
              await tx.batch.findUnique({
                where: {
                  productId_batchNumber: {
                    productId: item.productId,
                    batchNumber: billItem.batchNumber,
                  },
                },
              })
            )?.id ?? null
          : null;
        await this.stockService.remove(tx, {
          businessId,
          productId: item.productId,
          godownId: returnGodownId,
          batchId,
          quantity: item.quantity,
          sourceType: 'PURCHASE_RETURN',
          sourceId: id,
        });
      }

      const [purchaseReturnsAccount, gstInputAccount, apAccount] = await Promise.all([
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.PURCHASE_RETURNS, tx),
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.GST_INPUT, tx),
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, tx),
      ]);
      await this.journalService.postEntry(tx, {
        businessId,
        sourceType: 'PURCHASE_RETURN',
        sourceId: purchaseReturn.id,
        narration: `Purchase return ${purchaseReturn.returnNumber}`,
        lines: [
          { accountId: apAccount.id, debit: grandTotal },
          { accountId: purchaseReturnsAccount.id, credit: subtotal },
          { accountId: gstInputAccount.id, credit: taxTotal },
        ],
      });

      return purchaseReturn;
    });
  }

  /** Falls back to the bill's branch default godown for bills created before godown tracking existed. */
  private async resolveBillGodownId(
    tx: Prisma.TransactionClient,
    businessId: string,
    bill: { godownId: string | null; branchId: string | null },
  ) {
    if (bill.godownId) return bill.godownId;
    const branchId =
      bill.branchId ?? (await this.branchesService.getOrCreateDefaultBranch(businessId)).id;
    return (await this.godownsService.getOrCreateDefaultGodown(businessId, branchId, tx)).id;
  }

  async addPayment(businessId: string, id: string, dto: CreatePaymentDto) {
    const bill = await this.findOne(businessId, id);

    if (bill.status === 'CANCELLED') {
      throw new BadRequestException('Cannot record a payment on a cancelled bill');
    }

    const balanceDue = Number(bill.grandTotal) - Number(bill.amountPaid);
    if (dto.amount > balanceDue) {
      throw new BadRequestException(
        `Payment amount exceeds balance due (₹${balanceDue.toFixed(2)})`,
      );
    }

    const newAmountPaid = Number(bill.amountPaid) + dto.amount;
    const newStatus =
      newAmountPaid >= Number(bill.grandTotal) ? 'PAID' : 'PARTIALLY_PAID';

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.purchasePayment.create({
        data: {
          purchaseBillId: id,
          amount: dto.amount,
          paymentMode: dto.paymentMode ?? 'CASH',
          reference: dto.reference,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : undefined,
        },
      });

      const [apAccount, cashOrBankAccount] = await Promise.all([
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, tx),
        this.accountsService.getSystemAccount(
          businessId,
          paymentModeAccountCode(dto.paymentMode),
          tx,
        ),
      ]);
      await this.journalService.postEntry(tx, {
        businessId,
        sourceType: 'PURCHASE_PAYMENT',
        sourceId: payment.id,
        narration: `Payment made for bill ${bill.billNumber}`,
        lines: [
          { accountId: apAccount.id, debit: dto.amount },
          { accountId: cashOrBankAccount.id, credit: dto.amount },
        ],
      });

      return tx.purchaseBill.update({
        where: { id },
        data: { amountPaid: newAmountPaid, status: newStatus },
        include: {
          supplier: true,
          items: true,
          payments: { orderBy: { paymentDate: 'desc' } },
          returns: { include: { items: true }, orderBy: { returnDate: 'desc' } },
        },
      });
    });
  }

  async create(businessId: string, dto: CreatePurchaseBillDto, actor: JwtPayload) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, businessId },
    });
    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    let branchId: string;
    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, businessId },
      });
      if (!branch) {
        throw new BadRequestException('Branch not found');
      }
      branchId = branch.id;
    } else {
      branchId = (await this.branchesService.getOrCreateDefaultBranch(businessId)).id;
    }

    let godownId: string;
    if (dto.godownId) {
      const godown = await this.prisma.godown.findFirst({
        where: { id: dto.godownId, businessId, branchId },
      });
      if (!godown) {
        throw new BadRequestException('Godown not found for this branch');
      }
      godownId = godown.id;
    } else {
      godownId = (await this.godownsService.getOrCreateDefaultGodown(businessId, branchId)).id;
    }

    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, businessId },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new BadRequestException(
          `Product ${item.productId} not found`,
        );
      }
      if (product.tracksBatches && !item.batchNumber) {
        throw new BadRequestException(
          `"${product.name}" tracks batches — a batch number is required`,
        );
      }
    }

    const lineItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice ?? Number(product.purchasePrice);
      const gstRate = Number(product.gstRate);
      const lineSubtotal = unitPrice * item.quantity;
      const taxAmount = Math.round(lineSubtotal * (gstRate / 100) * 100) / 100;
      const lineTotal = lineSubtotal + taxAmount;

      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        gstRate,
        taxAmount,
        lineTotal,
        lineSubtotal,
        batchNumber: item.batchNumber,
        manufactureDate: item.manufactureDate,
        expiryDate: item.expiryDate,
      };
    });

    const subtotal = lineItems.reduce((sum, li) => sum + li.lineSubtotal, 0);
    const taxTotal = lineItems.reduce((sum, li) => sum + li.taxAmount, 0);
    const discountTotal = dto.discountTotal ?? 0;
    const grandTotal = subtotal + taxTotal - discountTotal;

    const billCount = await this.prisma.purchaseBill.count({
      where: { businessId },
    });
    const billNumber = `PUR-${String(billCount + 1).padStart(6, '0')}`;

    return this.prisma.$transaction(async (tx) => {
      const bill = await tx.purchaseBill.create({
        data: {
          businessId,
          branchId,
          godownId,
          supplierId: dto.supplierId,
          billNumber,
          status: 'UNPAID',
          subtotal,
          taxTotal,
          discountTotal,
          grandTotal,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              productName: li.productName,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              gstRate: li.gstRate,
              taxAmount: li.taxAmount,
              lineTotal: li.lineTotal,
              batchNumber: li.batchNumber,
              manufactureDate: li.manufactureDate,
              expiryDate: li.expiryDate,
            })),
          },
        },
        include: { items: true, supplier: true, branch: true, godown: true },
      });

      for (const item of dto.items) {
        await this.stockService.receive(tx, {
          businessId,
          productId: item.productId,
          godownId,
          quantity: item.quantity,
          batchInfo: item.batchNumber
            ? {
                batchNumber: item.batchNumber,
                manufactureDate: item.manufactureDate
                  ? new Date(item.manufactureDate)
                  : undefined,
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
              }
            : undefined,
          sourceType: 'PURCHASE',
          sourceId: bill.id,
        });
      }

      const [purchasesAccount, gstInputAccount, apAccount] = await Promise.all([
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.PURCHASES, tx),
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.GST_INPUT, tx),
        this.accountsService.getSystemAccount(businessId, SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, tx),
      ]);
      const lines: PostLine[] = [
        { accountId: purchasesAccount.id, debit: subtotal - discountTotal },
        { accountId: apAccount.id, credit: grandTotal },
      ];
      if (taxTotal > 0) {
        lines.push({ accountId: gstInputAccount.id, debit: taxTotal });
      }
      await this.journalService.postEntry(tx, {
        businessId,
        sourceType: 'PURCHASE_BILL',
        sourceId: bill.id,
        narration: `Purchase bill ${billNumber}`,
        lines,
      });

      await this.auditService.log(
        {
          businessId,
          userId: actor.sub,
          userEmail: actor.email,
          entityType: 'PurchaseBill',
          entityId: bill.id,
          action: 'CREATE',
          summary: `Created purchase bill ${billNumber} for ₹${grandTotal.toFixed(2)}`,
          changes: { after: bill },
        },
        tx,
      );

      return bill;
    });
  }

  async remove(businessId: string, id: string, actor: JwtPayload) {
    const bill = await this.findOne(businessId, id);

    return this.prisma.$transaction(async (tx) => {
      const godownId = await this.resolveBillGodownId(tx, businessId, bill);
      for (const item of bill.items) {
        const batchId = item.batchNumber
          ? (
              await tx.batch.findUnique({
                where: {
                  productId_batchNumber: {
                    productId: item.productId,
                    batchNumber: item.batchNumber,
                  },
                },
              })
            )?.id ?? null
          : null;
        await this.stockService.remove(tx, {
          businessId,
          productId: item.productId,
          godownId,
          batchId,
          quantity: Number(item.quantity),
          sourceType: 'ADJUSTMENT',
          sourceId: id,
        });
      }

      const sourceIds = [
        id,
        ...bill.payments.map((p) => p.id),
        ...bill.returns.map((r) => r.id),
      ];
      await tx.journalEntry.deleteMany({
        where: { businessId, sourceId: { in: sourceIds } },
      });

      await tx.purchaseBill.delete({ where: { id } });

      await this.auditService.log(
        {
          businessId,
          userId: actor.sub,
          userEmail: actor.email,
          entityType: 'PurchaseBill',
          entityId: id,
          action: 'DELETE',
          summary: `Deleted purchase bill ${bill.billNumber}`,
          changes: { before: bill },
        },
        tx,
      );

      return { success: true };
    });
  }
}
