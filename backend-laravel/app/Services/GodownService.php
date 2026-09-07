<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Godown;
use App\Models\ProductStock;
use Symfony\Component\HttpKernel\Exception\HttpException;

class GodownService
{
    public function findAll(string $businessId, ?string $branchId = null)
    {
        return Godown::with('branch')
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->get();
    }

    public function findOne(string $businessId, string $id): Godown
    {
        $godown = Godown::where('business_id', $businessId)->find($id);

        if (! $godown) {
            throw new HttpException(404, 'Godown not found');
        }

        return $godown;
    }

    public function create(string $businessId, array $data): Godown
    {
        $branch = Branch::where('id', $data['branchId'])->where('business_id', $businessId)->first();
        if (! $branch) {
            throw new HttpException(400, 'Branch not found');
        }

        return Godown::create([
            'business_id' => $businessId,
            'branch_id' => $data['branchId'],
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'is_default' => false,
        ]);
    }

    public function update(string $businessId, string $id, array $data): Godown
    {
        $godown = $this->findOne($businessId, $id);

        if (array_key_exists('name', $data)) {
            $godown->name = $data['name'];
        }
        if (array_key_exists('address', $data)) {
            $godown->address = $data['address'];
        }
        $godown->save();

        return $godown;
    }

    public function remove(string $businessId, string $id): array
    {
        $godown = $this->findOne($businessId, $id);

        if ($godown->is_default) {
            throw new HttpException(400, 'The default godown cannot be removed');
        }

        $stockCount = ProductStock::where('godown_id', $id)->where('quantity', '>', 0)->count();
        if ($stockCount > 0) {
            throw new HttpException(400, 'Cannot remove a godown that still holds stock. Transfer stock out first.');
        }

        $godown->delete();

        return ['success' => true];
    }

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
