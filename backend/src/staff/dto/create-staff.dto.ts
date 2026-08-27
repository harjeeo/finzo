import { IsEmail, IsIn, IsNotEmpty, MinLength } from 'class-validator';

const ASSIGNABLE_ROLES = ['MANAGER', 'ACCOUNTANT', 'CASHIER', 'STAFF'] as const;

export class CreateStaffDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  password: string;

  @IsIn(ASSIGNABLE_ROLES)
  role: (typeof ASSIGNABLE_ROLES)[number];
}
