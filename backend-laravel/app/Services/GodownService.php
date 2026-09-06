<?php

namespace App\Services;

use App\Models\Godown;

class GodownService
{
    public function getOrCreateDefaultGodown(string $businessId, string $branchId): Godown
    {
        $existing = Godown::where('business_id', $businessId)
            ->where('branch_id', $branchId)
            ->where('is_default', true)
            ->first();

        if ($existing) {
            return $existing;
        }

        return Godown::create([
            'business_id' => $businessId,
            'branch_id' => $branchId,
            'name' => 'Main Godown',
            'is_default' => true,
        ]);
    }
}
