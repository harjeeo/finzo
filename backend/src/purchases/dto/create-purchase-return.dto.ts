import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseReturnItemInputDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreatePurchaseReturnDto {
  @ValidateNested({ each: true })
  @Type(() => PurchaseReturnItemInputDto)
  @ArrayMinSize(1)
  items: PurchaseReturnItemInputDto[];
}
