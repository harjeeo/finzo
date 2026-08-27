import { apiFetch } from "./api";
import type { Supplier } from "./suppliers-api";

export interface PurchaseBillItem {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
  taxAmount: string;
  lineTotal: string;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  billDate: string;
  status: string;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  grandTotal: string;
  amountPaid: string;
  supplier: Supplier;
  items?: PurchaseBillItem[];
}

export interface PurchaseBillItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface PurchaseBillInput {
  supplierId: string;
  discountTotal?: number;
  items: PurchaseBillItemInput[];
}

export function listPurchaseBills(token: string) {
  return apiFetch<PurchaseBill[]>("/purchase-bills", { token });
}

export function getPurchaseBill(token: string, id: string) {
  return apiFetch<PurchaseBill>(`/purchase-bills/${id}`, { token });
}

export function createPurchaseBill(token: string, input: PurchaseBillInput) {
  return apiFetch<PurchaseBill>("/purchase-bills", {
    method: "POST",
    body: input,
    token,
  });
}

export function deletePurchaseBill(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/purchase-bills/${id}`, {
    method: "DELETE",
    token,
  });
}
