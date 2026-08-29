import { apiFetch } from "./api";
import type { Supplier } from "./suppliers-api";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "CONFIRMED"
  | "CANCELLED"
  | "CONVERTED";

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
  taxAmount: string;
  lineTotal: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  poDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  grandTotal: string;
  notes: string | null;
  supplier: Supplier;
  branch?: { id: string; name: string } | null;
  items?: PurchaseOrderItem[];
  convertedBill?: { id: string; billNumber: string } | null;
}

export interface PurchaseOrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface PurchaseOrderInput {
  supplierId: string;
  branchId?: string;
  expectedDate?: string;
  discountTotal?: number;
  notes?: string;
  items: PurchaseOrderItemInput[];
}

export function listPurchaseOrders(token: string, branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return apiFetch<PurchaseOrder[]>(`/purchase-orders${query}`, { token });
}

export function getPurchaseOrder(token: string, id: string) {
  return apiFetch<PurchaseOrder>(`/purchase-orders/${id}`, { token });
}

export function createPurchaseOrder(token: string, input: PurchaseOrderInput) {
  return apiFetch<PurchaseOrder>("/purchase-orders", {
    method: "POST",
    body: input,
    token,
  });
}

export function updatePurchaseOrderStatus(
  token: string,
  id: string,
  status: Exclude<PurchaseOrderStatus, "CONVERTED">,
) {
  return apiFetch<PurchaseOrder>(`/purchase-orders/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export function convertPurchaseOrderToBill(token: string, id: string) {
  return apiFetch<{ purchaseOrder: PurchaseOrder; bill: { id: string; billNumber: string } }>(
    `/purchase-orders/${id}/convert`,
    { method: "POST", token },
  );
}

export function deletePurchaseOrder(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/purchase-orders/${id}`, {
    method: "DELETE",
    token,
  });
}
