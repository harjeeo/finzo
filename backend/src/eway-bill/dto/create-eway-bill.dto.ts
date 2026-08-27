import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export type TransportModeValue = 'ROAD' | 'RAIL' | 'AIR' | 'SHIP';

const TRANSPORT_MODES: TransportModeValue[] = ['ROAD', 'RAIL', 'AIR', 'SHIP'];

export class CreateEwayBillDto {
  @IsOptional()
  @IsString()
  transporterName?: string;

  @IsOptional()
  @IsString()
  transporterId?: string;

  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @IsOptional()
  @IsIn(TRANSPORT_MODES)
  transportMode?: TransportModeValue;

  @IsInt()
  @Min(1)
  distanceKm: number;

  @IsOptional()
  @IsString()
  ewbNumber?: string;
}
