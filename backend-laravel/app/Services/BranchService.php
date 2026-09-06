<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Godown;
use Illuminate\Support\Facades\DB;

class BranchService
{
    public function getOrCreateDefaultBranch(string $businessId): Branch
    {
        $existing = Branch::where('business_id', $businessId)->where('is_default', true)->first();
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($businessId) {
            $branch = Branch::create([
                'business_id' => $businessId,
                'name' => 'Main Branch',
                'is_default' => true,
            ]);

            Godown::create([
                'business_id' => $businessId,
                'branch_id' => $branch->id,
                'name' => 'Main Godown',
                'is_default' => true,
            ]);

            return $branch;
        });
    }
}
