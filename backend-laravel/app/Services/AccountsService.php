<?php

namespace App\Services;

use App\Models\Account;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Only getSystemAccount is ported so far, needed by Purchases' auto-posted
 * journal entries. Full Accounts CRUD + trial balance lands with the
 * Accounting module.
 */
class AccountsService
{
    public function getSystemAccount(string $businessId, string $code): Account
    {
        $account = Account::where('business_id', $businessId)->where('code', $code)->first();

        if (! $account) {
            throw new HttpException(400, "System account \"{$code}\" not found for this business");
        }

        return $account;
    }
}
