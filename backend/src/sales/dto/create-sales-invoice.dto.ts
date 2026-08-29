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

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateSalesInvoiceDto {
  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  godownId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsString()
  paymentMode?: string;

  @ValidateNested({ each: true })
  @Type(() => SalesInvoiceItemInputDto)
  @ArrayMinSize(1)
  items: SalesInvoiceItemInputDto[];
}
