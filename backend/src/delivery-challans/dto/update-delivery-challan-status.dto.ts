import { IsIn } from 'class-validator';

const STATUSES = ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'] as const;

export class UpdateDeliveryChallanStatusDto {
  @IsIn(STATUSES)
  status: (typeof STATUSES)[number];
}
