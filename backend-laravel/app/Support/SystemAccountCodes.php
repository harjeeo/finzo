<?php

namespace App\Support;

class SystemAccountCodes
{
    public const CASH = 'CASH';

    public const BANK = 'BANK';

    public const ACCOUNTS_RECEIVABLE = 'AR';

    public const ACCOUNTS_PAYABLE = 'AP';

    public const GST_PAYABLE = 'GST_PAYABLE';

    public const GST_INPUT = 'GST_INPUT';

    public const SALES = 'SALES';

    public const SALES_RETURNS = 'SALES_RETURNS';

    public const PURCHASES = 'PURCHASES';

    public const PURCHASE_RETURNS = 'PURCHASE_RETURNS';

    public const EXPENSES = 'EXPENSES';

    public const CAPITAL = 'CAPITAL';

    /** Maps a transaction paymentMode string to the system cash/bank account it settles to. */
    public static function paymentModeAccountCode(?string $paymentMode): string
    {
        return $paymentMode === 'CASH' || ! $paymentMode
            ? self::CASH
            : self::BANK;
    }
}
