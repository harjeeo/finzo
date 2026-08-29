import { apiFetch } from "./api";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  openingBalance: string;
  creditLimit: string | null;
  priceListId: string | null;
  priceList?: { id: string; name: string } | null;
  createdAt: string;
}

export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  openingBalance?: number;
  creditLimit?: number;
  priceListId?: string;
}

export function listCustomers(token: string) {
  return apiFetch<Customer[]>("/customers", { token });
}

export function createCustomer(token: string, input: CustomerInput) {
  return apiFetch<Customer>("/customers", { method: "POST", body: input, token });
}

export function updateCustomer(
  token: string,
  id: string,
  input: CustomerInput,
) {
  return apiFetch<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteCustomer(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/customers/${id}`, {
    method: "DELETE",
    token,
  });
}
