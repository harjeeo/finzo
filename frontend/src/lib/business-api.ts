import { apiFetch } from "./api";

export interface Business {
  id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  invoicePrefix: string;
  currency: string;
}

export interface BusinessInput {
  name?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  invoicePrefix?: string;
  currency?: string;
}

export function getBusiness(token: string) {
  return apiFetch<Business>("/business", { token });
}

export function updateBusiness(token: string, input: BusinessInput) {
  return apiFetch<Business>("/business", {
    method: "PATCH",
    body: input,
    token,
  });
}
