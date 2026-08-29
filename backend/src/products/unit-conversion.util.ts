import { BadRequestException } from '@nestjs/common';

export interface UnitConversionInput {
  productId: string;
  productName: string;
  baseUnit: string;
  requestedUnit?: string;
}

export interface AvailableUnit {
  productId: string;
  name: string;
  conversionFactor: number | { toString(): string };
}

/** Resolves a requested unit name to its conversion factor against the product's base unit. */
export function resolveUnitConversion(
  input: UnitConversionInput,
  availableUnits: AvailableUnit[],
): { unit: string; conversionFactor: number } {
  const requested = input.requestedUnit?.trim();
  if (!requested || requested.toLowerCase() === input.baseUnit.trim().toLowerCase()) {
    return { unit: input.baseUnit, conversionFactor: 1 };
  }
  const match = availableUnits.find(
    (u) =>
      u.productId === input.productId &&
      u.name.trim().toLowerCase() === requested.toLowerCase(),
  );
  if (!match) {
    throw new BadRequestException(
      `"${requested}" is not a configured unit for "${input.productName}"`,
    );
  }
  return { unit: match.name, conversionFactor: Number(match.conversionFactor) };
}
