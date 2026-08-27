import { PartialType } from '@nestjs/mapped-types';
import { CreateEwayBillDto } from './create-eway-bill.dto.js';

export class UpdateEwayBillDto extends PartialType(CreateEwayBillDto) {}
