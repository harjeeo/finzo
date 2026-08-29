import { IsNumber, Min } from 'class-validator';

export class SetPriceListItemDto {
  @IsNumber()
  @Min(0)
  price: number;
}
