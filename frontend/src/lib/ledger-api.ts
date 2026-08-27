import { apiFetch } from "./api";
import type { Customer } from "./customers-api";
import type { Supplier } from "./suppliers-api";

export interface LedgerEntry {
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerLedger {
  customer: Customer;
  openingBalance: number;
  transactions: LedgerEntry[];
  outstandingBalance: number;
}

export interface SupplierLedger {
  supplier: Supplier;
  openingBalance: number;
  transactions: LedgerEntry[];
  outstandingBalance: number;
}

export function getCustomerLedger(token: string, id: string) {
  return apiFetch<CustomerLedger>(`/customers/${id}/ledger`, { token });
}

export function getSupplierLedger(token: string, id: string) {
  return apiFetch<SupplierLedger>(`/suppliers/${id}/ledger`, { token });
}
