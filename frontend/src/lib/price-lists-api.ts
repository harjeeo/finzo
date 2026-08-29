import { apiFetch } from "./api";
import type { Product } from "./products-api";

export interface PriceListItem {
  id: string;
  priceListId: string;
  productId: string;
  price: string;
  product: Product;
}

export interface PriceList {
  id: string;
  name: string;
  isDefault: boolean;
  items: PriceListItem[];
  createdAt: string;
}

export interface PriceListInput {
  name: string;
  isDefault?: boolean;
}

export function listPriceLists(token: string) {
  return apiFetch<PriceList[]>("/price-lists", { token });
}

export function getPriceList(token: string, id: string) {
  return apiFetch<PriceList>(`/price-lists/${id}`, { token });
}

export function createPriceList(token: string, input: PriceListInput) {
  return apiFetch<PriceList>("/price-lists", { method: "POST", body: input, token });
}

export function updatePriceList(token: string, id: string, input: Partial<PriceListInput>) {
  return apiFetch<PriceList>(`/price-lists/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deletePriceList(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/price-lists/${id}`, {
    method: "DELETE",
    token,
  });
}

export function setPriceListItem(
  token: string,
  priceListId: string,
  productId: string,
  price: number,
) {
  return apiFetch<PriceListItem>(`/price-lists/${priceListId}/items/${productId}`, {
    method: "POST",
    body: { price },
    token,
  });
}

export function removePriceListItem(token: string, priceListId: string, productId: string) {
  return apiFetch<{ success: boolean }>(`/price-lists/${priceListId}/items/${productId}`, {
    method: "DELETE",
    token,
  });
}
