<?php

namespace App\Services;

use App\Models\Account;
use App\Models\JournalEntryLine;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AccountsService
{
    public function findAll(string $businessId)
    {
        return Account::where('business_id', $businessId)
            ->orderBy('type')
            ->orderBy('code')
            ->get();
    }

    public function findOne(string $businessId, string $id): Account
    {
        $account = Account::where('business_id', $businessId)->find($id);

        if (! $account) {
            throw new HttpException(404, 'Account not found');
        }

        return $account;
    }

    public function create(string $businessId, array $data): Account
    {
        $existing = Account::where('business_id', $businessId)->where('code', $data['code'])->first();
        if ($existing) {
            throw new HttpException(400, 'An account with this code already exists');
        }

        return Account::create([
            'business_id' => $businessId,
            'code' => $data['code'],
            'name' => $data['name'],
            'type' => $data['type'],
            'is_bank_account' => $data['isBankAccount'] ?? false,
        ]);
    }

    public function update(string $businessId, string $id, array $data): Account
    {
        $account = $this->findOne($businessId, $id);

        if ($account->is_system && (array_key_exists('code', $data) || array_key_exists('type', $data))) {
            throw new HttpException(400, 'Only the name can be changed on a system account');
        }

        if ($account->is_system) {
            if (array_key_exists('name', $data)) {
                $account->name = $data['name'];
            }
        } else {
            $map = ['code' => 'code', 'name' => 'name', 'type' => 'type', 'isBankAccount' => 'is_bank_account'];
            foreach ($map as $requestKey => $column) {
                if (array_key_exists($requestKey, $data)) {
                    $account->{$column} = $data[$requestKey];
                }
            }
        }
        $account->save();

        return $account;
    }

    public function remove(string $businessId, string $id): array
    {
        $account = $this->findOne($businessId, $id);

        if ($account->is_system) {
            throw new HttpException(400, 'System accounts cannot be deleted');
        }

        $lineCount = JournalEntryLine::where('account_id', $id)->count();
        if ($lineCount > 0) {
            throw new HttpException(400, 'Cannot delete an account that has journal entries posted to it');
        }

        $account->delete();

        return ['success' => true];
    }

    public function getSystemAccount(string $businessId, string $code): Account
    {
        $account = Account::where('business_id', $businessId)->where('code', $code)->first();

        if (! $account) {
            throw new HttpException(400, "System account \"{$code}\" not found for this business");
        }

        return $account;
    }
}
