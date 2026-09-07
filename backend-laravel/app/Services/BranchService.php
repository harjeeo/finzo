<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Godown;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class BranchService
{
    public function findAll(string $businessId)
    {
        return Branch::where('business_id', $businessId)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Branch
    {
        $branch = Branch::where('business_id', $businessId)->find($id);

        if (! $branch) {
            throw new HttpException(404, 'Branch not found');
        }

        return $branch;
    }

    public function create(string $businessId, array $data): Branch
    {
        return DB::transaction(function () use ($businessId, $data) {
            $branch = Branch::create([
                'business_id' => $businessId,
                'name' => $data['name'],
                'address' => $data['address'] ?? null,
                'is_default' => false,
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

    public function update(string $businessId, string $id, array $data): Branch
    {
        $branch = $this->findOne($businessId, $id);

        if (array_key_exists('name', $data)) {
            $branch->name = $data['name'];
        }
        if (array_key_exists('address', $data)) {
            $branch->address = $data['address'];
        }
        $branch->save();

        return $branch;
    }

    public function remove(string $businessId, string $id): array
    {
        $branch = $this->findOne($businessId, $id);

        if ($branch->is_default) {
            throw new HttpException(400, 'The default branch cannot be removed');
        }

        $branch->delete();

        return ['success' => true];
    }

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
