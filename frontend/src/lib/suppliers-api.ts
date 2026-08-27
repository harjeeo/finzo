import { apiFetch } from "./api";

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  openingBalance: string;
  createdAt: string;
}

export interface SupplierInput {
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  openingBalance?: number;
}

export function listSuppliers(token: string) {
  return apiFetch<Supplier[]>("/suppliers", { token });
}

export function createSupplier(token: string, input: SupplierInput) {
  return apiFetch<Supplier>("/suppliers", { method: "POST", body: input, token });
}

export function updateSupplier(
  token: string,
  id: string,
  input: SupplierInput,
) {
  return apiFetch<Supplier>(`/suppliers/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteSupplier(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/suppliers/${id}`, {
    method: "DELETE",
    token,
  });
}
