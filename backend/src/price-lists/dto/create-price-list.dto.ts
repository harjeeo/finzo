import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceListItemInputDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  price: number;
}

export class CreatePriceListDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PriceListItemInputDto)
  @ArrayMinSize(0)
  items?: PriceListItemInputDto[];
}
