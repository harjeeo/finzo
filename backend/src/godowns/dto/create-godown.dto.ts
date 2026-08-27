import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateGodownDto {
  @IsNotEmpty()
  @IsString()
  branchId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}
