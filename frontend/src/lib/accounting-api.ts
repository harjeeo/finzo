import { apiFetch } from "./api";

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "INCOME" | "EXPENSE";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  isSystem: boolean;
  openingBalance: string;
}

export interface AccountInput {
  code: string;
  name: string;
  type: AccountType;
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string | null;
  account: Account;
}

export type JournalSourceType =
  | "MANUAL"
  | "SALES_INVOICE"
  | "SALES_PAYMENT"
  | "SALES_RETURN"
  | "PURCHASE_BILL"
  | "PURCHASE_PAYMENT"
  | "PURCHASE_RETURN"
  | "EXPENSE";

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  narration: string | null;
  sourceType: JournalSourceType;
  sourceId: string | null;
  lines: JournalLine[];
}

export interface JournalLineInput {
  accountId: string;
  debit?: number;
  credit?: number;
  description?: string;
}

export interface CreateJournalEntryInput {
  entryDate?: string;
  narration?: string;
  lines: JournalLineInput[];
}

export interface LedgerLine {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  narration: string | null;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
}

export interface Ledger {
  account: Account;
  openingBalance: number;
  closingBalance: number;
  entries: LedgerLine[];
}

export interface TrialBalanceRow {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  debit: number;
  credit: number;
  balance: number;
}

export interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
}

export function listAccounts(token: string) {
  return apiFetch<Account[]>("/accounts", { token });
}

export function createAccount(token: string, input: AccountInput) {
  return apiFetch<Account>("/accounts", { method: "POST", body: input, token });
}

export function updateAccount(
  token: string,
  id: string,
  input: Partial<AccountInput>,
) {
  return apiFetch<Account>(`/accounts/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteAccount(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/accounts/${id}`, {
    method: "DELETE",
    token,
  });
}

export function listJournalEntries(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return apiFetch<JournalEntry[]>(
    `/journal/entries${query ? `?${query}` : ""}`,
    { token },
  );
}

export function getJournalEntry(token: string, id: string) {
  return apiFetch<JournalEntry>(`/journal/entries/${id}`, { token });
}

export function createJournalEntry(
  token: string,
  input: CreateJournalEntryInput,
) {
  return apiFetch<JournalEntry>("/journal/entries", {
    method: "POST",
    body: input,
    token,
  });
}

export function deleteJournalEntry(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/journal/entries/${id}`, {
    method: "DELETE",
    token,
  });
}

export function getLedger(token: string, accountId: string) {
  return apiFetch<Ledger>(`/journal/ledger/${accountId}`, { token });
}

export function getTrialBalance(token: string) {
  return apiFetch<TrialBalance>("/journal/trial-balance", { token });
}
