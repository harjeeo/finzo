import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateStockTransferDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsNotEmpty()
  @IsString()
  fromGodownId: string;

  @IsNotEmpty()
  @IsString()
  toGodownId: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
