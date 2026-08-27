import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SalesReturnItemInputDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateSalesReturnDto {
  @ValidateNested({ each: true })
  @Type(() => SalesReturnItemInputDto)
  @ArrayMinSize(1)
  items: SalesReturnItemInputDto[];
}
