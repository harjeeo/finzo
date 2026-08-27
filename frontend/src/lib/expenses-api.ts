import { apiFetch } from "./api";

export interface Expense {
  id: string;
  category: string;
  amount: string;
  paymentMode: string;
  reference: string | null;
  expenseDate: string;
  createdAt: string;
}

export interface ExpenseInput {
  category: string;
  amount: number;
  paymentMode?: string;
  reference?: string;
  expenseDate?: string;
}

export function listExpenses(token: string) {
  return apiFetch<Expense[]>("/expenses", { token });
}

export function createExpense(token: string, input: ExpenseInput) {
  return apiFetch<Expense>("/expenses", { method: "POST", body: input, token });
}

export function updateExpense(token: string, id: string, input: ExpenseInput) {
  return apiFetch<Expense>(`/expenses/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteExpense(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/expenses/${id}`, {
    method: "DELETE",
    token,
  });
}
