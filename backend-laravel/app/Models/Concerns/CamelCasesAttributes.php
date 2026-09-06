<?php

namespace App\Models\Concerns;

/**
 * Serializes Eloquent's snake_case column names as camelCase in API responses,
 * matching what the React frontend expects (it was originally built against a
 * Prisma/Node backend that returns camelCase by default).
 */
trait CamelCasesAttributes
{
    public function toArray(): array
    {
        return $this->camelCaseKeys(parent::toArray());
    }

    private function camelCaseKeys(array $data): array
    {
        $result = [];

        foreach ($data as $key => $value) {
            $camelKey = is_string($key) ? lcfirst(str_replace(' ', '', ucwords(str_replace(['_', '-'], ' ', $key)))) : $key;

            if (is_array($value)) {
                $isList = array_is_list($value);
                $value = $isList
                    ? array_map(fn ($item) => is_array($item) ? $this->camelCaseKeys($item) : $item, $value)
                    : $this->camelCaseKeys($value);
            }

            $result[$camelKey] = $value;
        }

        return $result;
    }
}
