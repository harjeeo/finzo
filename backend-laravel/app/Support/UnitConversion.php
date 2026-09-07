<?php

namespace App\Support;

use Symfony\Component\HttpKernel\Exception\HttpException;

class UnitConversion
{
    /**
     * Resolves a requested unit name to its conversion factor against the product's base unit.
     * $availableUnits is a list of ProductUnit-like arrays/objects with productId, name, conversionFactor.
     *
     * @return array{unit: string, conversionFactor: float}
     */
    public static function resolve(
        string $productId,
        string $productName,
        string $baseUnit,
        ?string $requestedUnit,
        iterable $availableUnits,
    ): array {
        $requested = $requestedUnit !== null ? trim($requestedUnit) : null;
        if (! $requested || strtolower($requested) === strtolower(trim($baseUnit))) {
            return ['unit' => $baseUnit, 'conversionFactor' => 1.0];
        }

        foreach ($availableUnits as $unit) {
            $unitProductId = is_array($unit) ? $unit['productId'] : $unit->product_id;
            $unitName = is_array($unit) ? $unit['name'] : $unit->name;
            $conversionFactor = is_array($unit) ? $unit['conversionFactor'] : $unit->conversion_factor;

            if ($unitProductId === $productId && strtolower(trim($unitName)) === strtolower($requested)) {
                return ['unit' => $unitName, 'conversionFactor' => (float) $conversionFactor];
            }
        }

        throw new HttpException(400, "\"{$requested}\" is not a configured unit for \"{$productName}\"");
    }
}
