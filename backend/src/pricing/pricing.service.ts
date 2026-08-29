import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(
    businessId: string,
    productId: string,
    customerId?: string,
    quantity = 1,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, businessId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    let basePrice = Number(product.sellingPrice);
    let source: 'product' | 'price_list' = 'product';

    if (customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, businessId },
      });
      if (customer?.priceListId) {
        const item = await this.prisma.priceListItem.findUnique({
          where: {
            priceListId_productId: { priceListId: customer.priceListId, productId },
          },
        });
        if (item) {
          basePrice = Number(item.price);
          source = 'price_list';
        }
      }
    }

    const now = new Date();
    const schemes = await this.prisma.discountScheme.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [{ productId }, { productId: null }],
        minQuantity: { lte: quantity },
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: now } }] },
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
    });

    const best = schemes
      .map((s) => ({
        scheme: s,
        discountAmount:
          s.discountType === 'PERCENTAGE'
            ? basePrice * (Number(s.value) / 100)
            : Number(s.value),
      }))
      .sort((a, b) => {
        if (Boolean(a.scheme.productId) !== Boolean(b.scheme.productId)) {
          return a.scheme.productId ? -1 : 1;
        }
        return b.discountAmount - a.discountAmount;
      })[0];

    const discountAmount = best ? Math.min(best.discountAmount, basePrice) : 0;
    const finalUnitPrice = Math.max(basePrice - discountAmount, 0);

    return {
      productId,
      basePrice,
      source,
      discountScheme: best
        ? {
            id: best.scheme.id,
            name: best.scheme.name,
            discountType: best.scheme.discountType,
            value: Number(best.scheme.value),
          }
        : null,
      discountAmount,
      finalUnitPrice,
    };
  }
}
