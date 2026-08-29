import { apiFetch } from "./api";
import type { Account } from "./accounting-api";

export interface ReconciliationLine {
  id: string;
  journalEntryId: string;
  entryNumber: string;
  entryDate: string;
  narration: string | null;
  description: string | null;
  debit: number;
  credit: number;
  isReconciled: boolean;
  reconciledAt: string | null;
}

export interface Reconciliation {
  account: Account;
  openingBalance: number;
  bookBalance: number;
  reconciledBalance: number;
  entries: ReconciliationLine[];
}

export function listBankAccounts(token: string) {
  return apiFetch<Account[]>("/reconciliation/accounts", { token });
}

export function getReconciliation(token: string, accountId: string) {
  return apiFetch<Reconciliation>(`/reconciliation/${accountId}`, { token });
}

export function setLineReconciled(
  token: string,
  accountId: string,
  lineId: string,
  reconciled: boolean,
) {
  return apiFetch(`/reconciliation/${accountId}/lines/${lineId}`, {
    method: "PATCH",
    body: { reconciled },
    token,
  });
}
