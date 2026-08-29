import { apiFetch } from "./api";
import type { Product } from "./products-api";

export type DiscountType = "PERCENTAGE" | "FLAT";

export interface DiscountScheme {
  id: string;
  name: string;
  discountType: DiscountType;
  value: string;
  productId: string | null;
  product: Product | null;
  minQuantity: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DiscountSchemeInput {
  name: string;
  discountType: DiscountType;
  value: number;
  productId?: string;
  minQuantity?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export function listDiscountSchemes(token: string) {
  return apiFetch<DiscountScheme[]>("/discount-schemes", { token });
}

export function createDiscountScheme(token: string, input: DiscountSchemeInput) {
  return apiFetch<DiscountScheme>("/discount-schemes", {
    method: "POST",
    body: input,
    token,
  });
}

export function updateDiscountScheme(
  token: string,
  id: string,
  input: Partial<DiscountSchemeInput>,
) {
  return apiFetch<DiscountScheme>(`/discount-schemes/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteDiscountScheme(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/discount-schemes/${id}`, {
    method: "DELETE",
    token,
  });
}
