import { PartialType } from '@nestjs/mapped-types';
import { CreateDiscountSchemeDto } from './create-discount-scheme.dto.js';

export class UpdateDiscountSchemeDto extends PartialType(CreateDiscountSchemeDto) {}
