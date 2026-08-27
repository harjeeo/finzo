import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

export type StockSourceTypeValue =
  | 'PURCHASE'
  | 'PURCHASE_RETURN'
  | 'SALES'
  | 'SALES_RETURN'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT';

export interface BatchInfo {
  batchNumber: string;
  manufactureDate?: Date;
  expiryDate?: Date;
}

export interface ConsumedBatch {
  batchId: string;
  batchNumber: string;
  quantity: number;
}

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

  private async findOrCreateBatch(
    tx: Prisma.TransactionClient,
    businessId: string,
    productId: string,
    info: BatchInfo,
  ) {
    const existing = await tx.batch.findUnique({
      where: { productId_batchNumber: { productId, batchNumber: info.batchNumber } },
    });
    if (existing) return existing;
    return tx.batch.create({
      data: {
        businessId,
        productId,
        batchNumber: info.batchNumber,
        manufactureDate: info.manufactureDate,
        expiryDate: info.expiryDate,
      },
    });
  }

  /** Adjusts the stock cache + product total + movement log by a signed quantity delta. */
  private async adjustStock(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      batchId: string | null;
      quantityDelta: number;
      sourceType: StockSourceTypeValue;
      sourceId?: string;
      notes?: string;
    },
  ) {
    // A findUnique on the compound key can't express a null batchId in Prisma's typed API,
    // so we look it up via findFirst instead; the unique constraint still guarantees at most one row.
    const existing = await tx.productStock.findFirst({
      where: {
        productId: params.productId,
        godownId: params.godownId,
        batchId: params.batchId,
      },
    });

    const newQuantity = Number(existing?.quantity ?? 0) + params.quantityDelta;
    if (newQuantity < 0) {
      throw new BadRequestException('Insufficient stock in the selected godown');
    }

    if (existing) {
      await tx.productStock.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await tx.productStock.create({
        data: {
          businessId: params.businessId,
          productId: params.productId,
          godownId: params.godownId,
          batchId: params.batchId,
          quantity: newQuantity,
        },
      });
    }

    await tx.stockMovement.create({
      data: {
        businessId: params.businessId,
        productId: params.productId,
        godownId: params.godownId,
        batchId: params.batchId,
        quantity: params.quantityDelta,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        notes: params.notes,
      },
    });

    await tx.product.update({
      where: { id: params.productId },
      data: { currentStock: { increment: params.quantityDelta } },
    });
  }

  /** Receives stock into a godown (purchase, or a manual adjustment). Creates the batch if needed. */
  async receive(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      quantity: number;
      batchInfo?: BatchInfo;
      sourceType: StockSourceTypeValue;
      sourceId?: string;
    },
  ) {
    let batchId: string | null = null;
    if (params.batchInfo) {
      const batch = await this.findOrCreateBatch(
        tx,
        params.businessId,
        params.productId,
        params.batchInfo,
      );
      batchId = batch.id;
    }
    await this.adjustStock(tx, {
      businessId: params.businessId,
      productId: params.productId,
      godownId: params.godownId,
      batchId,
      quantityDelta: params.quantity,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    });
    return { batchId };
  }

  /** Receives stock into a godown against an already-known batch (or no batch). Used by transfers. */
  async receiveExisting(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      batchId: string | null;
      quantity: number;
      sourceType: StockSourceTypeValue;
      sourceId?: string;
    },
  ) {
    await this.adjustStock(tx, {
      businessId: params.businessId,
      productId: params.productId,
      godownId: params.godownId,
      batchId: params.batchId,
      quantityDelta: params.quantity,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    });
  }

  /** Removes stock from a specific godown+batch (purchase return, transfer-out, manual adjustment). */
  async remove(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      batchId: string | null;
      quantity: number;
      sourceType: StockSourceTypeValue;
      sourceId?: string;
    },
  ) {
    await this.adjustStock(tx, {
      businessId: params.businessId,
      productId: params.productId,
      godownId: params.godownId,
      batchId: params.batchId,
      quantityDelta: -params.quantity,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    });
  }

  /** Consumes stock for a non-batch-tracked product from a single godown. */
  async consumeSimple(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      quantity: number;
      sourceType: StockSourceTypeValue;
      sourceId?: string;
    },
  ) {
    await this.adjustStock(tx, {
      businessId: params.businessId,
      productId: params.productId,
      godownId: params.godownId,
      batchId: null,
      quantityDelta: -params.quantity,
      sourceType: params.sourceType,
      sourceId: params.sourceId,
    });
  }

  /**
   * Consumes stock for a batch-tracked product using FEFO (first-expiring-first-out),
   * splitting across batches if needed. Throws if the godown doesn't have enough total stock.
   */
  async consumeFefo(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      quantity: number;
      sourceType: StockSourceTypeValue;
      sourceId?: string;
    },
  ): Promise<ConsumedBatch[]> {
    const unsortedStocks = await tx.productStock.findMany({
      where: {
        productId: params.productId,
        godownId: params.godownId,
        batchId: { not: null },
        quantity: { gt: 0 },
      },
      include: { batch: true },
    });
    // FEFO: nearest expiry first, batches with no expiry date go last, tie-broken by batch age.
    const stocks = unsortedStocks.sort((a, b) => {
      const aExpiry = a.batch?.expiryDate?.getTime() ?? Infinity;
      const bExpiry = b.batch?.expiryDate?.getTime() ?? Infinity;
      if (aExpiry !== bExpiry) return aExpiry - bExpiry;
      return (a.batch?.createdAt.getTime() ?? 0) - (b.batch?.createdAt.getTime() ?? 0);
    });

    let remaining = params.quantity;
    const consumed: ConsumedBatch[] = [];

    for (const stock of stocks) {
      if (remaining <= 0) break;
      const available = Number(stock.quantity);
      const take = Math.min(available, remaining);
      if (take <= 0 || !stock.batch) continue;

      await this.adjustStock(tx, {
        businessId: params.businessId,
        productId: params.productId,
        godownId: params.godownId,
        batchId: stock.batchId,
        quantityDelta: -take,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
      });

      consumed.push({
        batchId: stock.batchId!,
        batchNumber: stock.batch.batchNumber,
        quantity: take,
      });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new BadRequestException(
        'Insufficient batch stock in the selected godown for this product',
      );
    }

    return consumed;
  }

  /** Restores previously-consumed batch quantities (sales return), in the same order consumed. */
  async restoreBatches(
    tx: Prisma.TransactionClient,
    params: {
      businessId: string;
      productId: string;
      godownId: string;
      allocations: ConsumedBatch[];
      sourceType: StockSourceTypeValue;
      sourceId?: string;
    },
  ) {
    for (const allocation of params.allocations) {
      await this.adjustStock(tx, {
        businessId: params.businessId,
        productId: params.productId,
        godownId: params.godownId,
        batchId: allocation.batchId,
        quantityDelta: allocation.quantity,
        sourceType: params.sourceType,
        sourceId: params.sourceId,
      });
    }
  }

  async getStockByProduct(businessId: string, productId: string) {
    const stocks = await this.prisma.productStock.findMany({
      where: { businessId, productId, quantity: { gt: 0 } },
      include: { godown: { include: { branch: true } }, batch: true },
      orderBy: [{ godown: { name: 'asc' } }],
    });
    return stocks.map((s) => ({
      godownId: s.godownId,
      godownName: s.godown.name,
      branchName: s.godown.branch.name,
      batchId: s.batchId,
      batchNumber: s.batch?.batchNumber ?? null,
      expiryDate: s.batch?.expiryDate ?? null,
      quantity: Number(s.quantity),
    }));
  }

  async getExpiryReport(businessId: string, withinDays = 60) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);

    const batches = await this.prisma.batch.findMany({
      where: {
        businessId,
        expiryDate: { not: null },
        stocks: { some: { quantity: { gt: 0 } } },
      },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        stocks: {
          where: { quantity: { gt: 0 } },
          include: { godown: { select: { id: true, name: true } } },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    const now = new Date();
    return batches.map((b) => {
      const totalQuantity = b.stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
      const isExpired = b.expiryDate! < now;
      const isExpiringSoon = !isExpired && b.expiryDate! <= cutoff;
      return {
        batchId: b.id,
        batchNumber: b.batchNumber,
        productId: b.product.id,
        productName: b.product.name,
        unit: b.product.unit,
        expiryDate: b.expiryDate,
        totalQuantity,
        status: isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING_SOON' : 'OK',
        stocks: b.stocks.map((s) => ({
          godownId: s.godown.id,
          godownName: s.godown.name,
          quantity: Number(s.quantity),
        })),
      };
    });
  }
}
