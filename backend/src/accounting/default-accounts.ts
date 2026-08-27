export const SYSTEM_ACCOUNT_CODES = {
  CASH: 'CASH',
  BANK: 'BANK',
  ACCOUNTS_RECEIVABLE: 'AR',
  ACCOUNTS_PAYABLE: 'AP',
  GST_PAYABLE: 'GST_PAYABLE',
  GST_INPUT: 'GST_INPUT',
  SALES: 'SALES',
  SALES_RETURNS: 'SALES_RETURNS',
  PURCHASES: 'PURCHASES',
  PURCHASE_RETURNS: 'PURCHASE_RETURNS',
  EXPENSES: 'EXPENSES',
  CAPITAL: 'CAPITAL',
} as const;

export const DEFAULT_ACCOUNTS: {
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
}[] = [
  { code: SYSTEM_ACCOUNT_CODES.CASH, name: 'Cash', type: 'ASSET' },
  { code: SYSTEM_ACCOUNT_CODES.BANK, name: 'Bank', type: 'ASSET' },
  {
    code: SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE,
    name: 'Accounts Receivable',
    type: 'ASSET',
  },
  {
    code: SYSTEM_ACCOUNT_CODES.GST_INPUT,
    name: 'GST Input Credit',
    type: 'ASSET',
  },
  {
    code: SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE,
    name: 'Accounts Payable',
    type: 'LIABILITY',
  },
  {
    code: SYSTEM_ACCOUNT_CODES.GST_PAYABLE,
    name: 'GST Payable',
    type: 'LIABILITY',
  },
  { code: SYSTEM_ACCOUNT_CODES.CAPITAL, name: "Owner's Capital", type: 'EQUITY' },
  { code: SYSTEM_ACCOUNT_CODES.SALES, name: 'Sales', type: 'INCOME' },
  {
    code: SYSTEM_ACCOUNT_CODES.SALES_RETURNS,
    name: 'Sales Returns',
    type: 'INCOME',
  },
  { code: SYSTEM_ACCOUNT_CODES.PURCHASES, name: 'Purchases', type: 'EXPENSE' },
  {
    code: SYSTEM_ACCOUNT_CODES.PURCHASE_RETURNS,
    name: 'Purchase Returns',
    type: 'EXPENSE',
  },
  {
    code: SYSTEM_ACCOUNT_CODES.EXPENSES,
    name: 'Business Expenses',
    type: 'EXPENSE',
  },
];

/** Maps a transaction paymentMode string to the system cash/bank account it settles to. */
export function paymentModeAccountCode(paymentMode?: string | null): string {
  return paymentMode === 'CASH' || !paymentMode
    ? SYSTEM_ACCOUNT_CODES.CASH
    : SYSTEM_ACCOUNT_CODES.BANK;
}
