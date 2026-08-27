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

export class SalesInvoiceItemInputDto {
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

export class CreateSalesInvoiceDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceItemInputDto)
  @ArrayMinSize(1)
  items: SalesInvoiceItemInputDto[];
}
