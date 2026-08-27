import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseBillItemInputDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class CreatePurchaseBillDto {
  @IsNotEmpty()
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @ValidateNested({ each: true })
  @Type(() => PurchaseBillItemInputDto)
  @ArrayMinSize(1)
  items: PurchaseBillItemInputDto[];
}
