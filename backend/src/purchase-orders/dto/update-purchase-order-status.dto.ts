import { IsIn } from 'class-validator';

const STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'CANCELLED'] as const;

export class UpdatePurchaseOrderStatusDto {
  @IsIn(STATUSES)
  status: (typeof STATUSES)[number];
}
