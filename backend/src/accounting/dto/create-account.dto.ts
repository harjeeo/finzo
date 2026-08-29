import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type AccountTypeValue = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

const ACCOUNT_TYPES: AccountTypeValue[] = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'INCOME',
  'EXPENSE',
];

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(ACCOUNT_TYPES)
  type: AccountTypeValue;

  @IsOptional()
  @IsBoolean()
  isBankAccount?: boolean;
}
