import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductUnitDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.0001)
  conversionFactor: number;
}
