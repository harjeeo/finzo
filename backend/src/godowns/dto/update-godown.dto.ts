import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateGodownDto } from './create-godown.dto.js';

export class UpdateGodownDto extends PartialType(
  OmitType(CreateGodownDto, ['branchId'] as const),
) {}
