import { apiFetch } from "./api";
import type { Customer } from "./customers-api";

export type DeliveryChallanStatus =
  | "DRAFT"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED";

export interface DeliveryChallanItem {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
}

export interface DeliveryChallan {
  id: string;
  challanNumber: string;
  challanDate: string;
  vehicleNumber: string | null;
  transporterName: string | null;
  status: DeliveryChallanStatus;
  notes: string | null;
  customer: Customer;
  branch?: { id: string; name: string } | null;
  items?: DeliveryChallanItem[];
  salesInvoice?: { id: string; invoiceNumber: string } | null;
}

export interface DeliveryChallanItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface DeliveryChallanInput {
  customerId: string;
  branchId?: string;
  salesInvoiceId?: string;
  vehicleNumber?: string;
  transporterName?: string;
  notes?: string;
  items: DeliveryChallanItemInput[];
}

export function listDeliveryChallans(token: string, branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return apiFetch<DeliveryChallan[]>(`/delivery-challans${query}`, { token });
}

export function getDeliveryChallan(token: string, id: string) {
  return apiFetch<DeliveryChallan>(`/delivery-challans/${id}`, { token });
}

export function createDeliveryChallan(token: string, input: DeliveryChallanInput) {
  return apiFetch<DeliveryChallan>("/delivery-challans", {
    method: "POST",
    body: input,
    token,
  });
}

export function updateDeliveryChallanStatus(
  token: string,
  id: string,
  status: DeliveryChallanStatus,
) {
  return apiFetch<DeliveryChallan>(`/delivery-challans/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export function deleteDeliveryChallan(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/delivery-challans/${id}`, {
    method: "DELETE",
    token,
  });
}
