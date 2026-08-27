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

export interface PurchasePayment {
  id: string;
  amount: string;
  paymentMode: string;
  reference: string | null;
  paymentDate: string;
}

export interface PurchaseReturnItem {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
  taxAmount: string;
  lineTotal: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  returnDate: string;
  subtotal: string;
  taxTotal: string;
  grandTotal: string;
  items: PurchaseReturnItem[];
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
  branch?: { id: string; name: string } | null;
  items?: PurchaseBillItem[];
  payments?: PurchasePayment[];
  returns?: PurchaseReturn[];
}

export interface PurchaseReturnInput {
  items: { productId: string; quantity: number }[];
}

export interface PaymentInput {
  amount: number;
  paymentMode?: string;
  reference?: string;
  paymentDate?: string;
}

export interface PurchaseBillItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
}

export interface PurchaseBillInput {
  supplierId: string;
  branchId?: string;
  godownId?: string;
  discountTotal?: number;
  items: PurchaseBillItemInput[];
}

export function listPurchaseBills(token: string, branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return apiFetch<PurchaseBill[]>(`/purchase-bills${query}`, { token });
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

export function addPurchasePayment(
  token: string,
  id: string,
  input: PaymentInput,
) {
  return apiFetch<PurchaseBill>(`/purchase-bills/${id}/payments`, {
    method: "POST",
    body: input,
    token,
  });
}

export function createPurchaseReturn(
  token: string,
  id: string,
  input: PurchaseReturnInput,
) {
  return apiFetch<PurchaseReturn>(`/purchase-bills/${id}/returns`, {
    method: "POST",
    body: input,
    token,
  });
}
