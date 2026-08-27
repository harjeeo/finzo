import { IsIn } from 'class-validator';

const ASSIGNABLE_ROLES = ['MANAGER', 'ACCOUNTANT', 'CASHIER', 'STAFF'] as const;

export class UpdateStaffDto {
  @IsIn(ASSIGNABLE_ROLES)
  role: (typeof ASSIGNABLE_ROLES)[number];
}
