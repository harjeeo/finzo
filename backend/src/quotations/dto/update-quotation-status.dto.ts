import { IsIn } from 'class-validator';

const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const;

export class UpdateQuotationStatusDto {
  @IsIn(STATUSES)
  status: (typeof STATUSES)[number];
}
