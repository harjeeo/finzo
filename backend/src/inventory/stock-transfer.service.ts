import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { StockService } from './stock.service.js';
import { AuditService } from '../audit/audit.service.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';
import { CreateStockTransferDto } from './dto/create-stock-transfer.dto.js';

@Injectable()
export class StockTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: StockService,
    private readonly auditService: AuditService,
  ) {}

  findAll(businessId: string) {
    return this.prisma.stockTransfer.findMany({
      where: { businessId },
      include: {
        product: { select: { id: true, name: true, unit: true } },
        batch: { select: { id: true, batchNumber: true } },
        fromGodown: { select: { id: true, name: true } },
        toGodown: { select: { id: true, name: true } },
      },
      orderBy: { transferDate: 'desc' },
    });
  }

  async create(businessId: string, dto: CreateStockTransferDto, actor: JwtPayload) {
    if (dto.fromGodownId === dto.toGodownId) {
      throw new BadRequestException('Source and destination godowns must be different');
    }

    const [product, fromGodown, toGodown] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: dto.productId, businessId } }),
      this.prisma.godown.findFirst({ where: { id: dto.fromGodownId, businessId } }),
      this.prisma.godown.findFirst({ where: { id: dto.toGodownId, businessId } }),
    ]);
    if (!product) throw new NotFoundException('Product not found');
    if (!fromGodown) throw new NotFoundException('Source godown not found');
    if (!toGodown) throw new NotFoundException('Destination godown not found');

    if (product.tracksBatches && !dto.batchId) {
      throw new BadRequestException('This product tracks batches — select a batch to transfer');
    }
    if (dto.batchId) {
      const batch = await this.prisma.batch.findFirst({
        where: { id: dto.batchId, businessId, productId: dto.productId },
      });
      if (!batch) throw new NotFoundException('Batch not found for this product');
    }

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.create({
        data: {
          businessId,
          productId: dto.productId,
          batchId: dto.batchId,
          fromGodownId: dto.fromGodownId,
          toGodownId: dto.toGodownId,
          quantity: dto.quantity,
          notes: dto.notes,
        },
      });

      await this.stockService.remove(tx, {
        businessId,
        productId: dto.productId,
        godownId: dto.fromGodownId,
        batchId: dto.batchId ?? null,
        quantity: dto.quantity,
        sourceType: 'TRANSFER_OUT',
        sourceId: transfer.id,
      });
      await this.stockService.receiveExisting(tx, {
        businessId,
        productId: dto.productId,
        godownId: dto.toGodownId,
        batchId: dto.batchId ?? null,
        quantity: dto.quantity,
        sourceType: 'TRANSFER_IN',
        sourceId: transfer.id,
      });

      await this.auditService.log(
        {
          businessId,
          userId: actor.sub,
          userEmail: actor.email,
          entityType: 'StockTransfer',
          entityId: transfer.id,
          action: 'CREATE',
          summary: `Transferred ${dto.quantity} ${product.unit} of "${product.name}" from ${fromGodown.name} to ${toGodown.name}`,
          changes: { after: transfer },
        },
        tx,
      );

      return transfer;
    });
  }
}
