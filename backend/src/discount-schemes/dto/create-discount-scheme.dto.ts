import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export type DiscountTypeValue = 'PERCENTAGE' | 'FLAT';

const DISCOUNT_TYPES: DiscountTypeValue[] = ['PERCENTAGE', 'FLAT'];

export class CreateDiscountSchemeDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEnum(DISCOUNT_TYPES)
  discountType: DiscountTypeValue;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
