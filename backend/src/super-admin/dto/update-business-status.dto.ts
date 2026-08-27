import { IsIn } from 'class-validator';

export class UpdateBusinessStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status: 'ACTIVE' | 'SUSPENDED';
}
