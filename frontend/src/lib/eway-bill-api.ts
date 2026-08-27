import { apiFetch } from "./api";

export const EWAY_BILL_THRESHOLD = 50000;

export type TransportMode = "ROAD" | "RAIL" | "AIR" | "SHIP";
export type EwayBillStatus = "GENERATED" | "CANCELLED";

export interface EwayBill {
  id: string;
  salesInvoiceId: string;
  ewbNumber: string | null;
  transporterName: string | null;
  transporterId: string | null;
  vehicleNumber: string | null;
  transportMode: TransportMode;
  distanceKm: number;
  validUntil: string;
  status: EwayBillStatus;
  createdAt: string;
}

export interface EwayBillInput {
  transporterName?: string;
  transporterId?: string;
  vehicleNumber?: string;
  transportMode?: TransportMode;
  distanceKm: number;
  ewbNumber?: string;
}

export function getEwayBill(token: string, invoiceId: string) {
  return apiFetch<EwayBill | null>(`/sales-invoices/${invoiceId}/eway-bill`, {
    token,
  });
}

export function generateEwayBill(
  token: string,
  invoiceId: string,
  input: EwayBillInput,
) {
  return apiFetch<EwayBill>(`/sales-invoices/${invoiceId}/eway-bill`, {
    method: "POST",
    body: input,
    token,
  });
}

export function updateEwayBill(
  token: string,
  invoiceId: string,
  input: Partial<EwayBillInput>,
) {
  return apiFetch<EwayBill>(`/sales-invoices/${invoiceId}/eway-bill`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function cancelEwayBill(token: string, invoiceId: string) {
  return apiFetch<EwayBill>(`/sales-invoices/${invoiceId}/eway-bill/cancel`, {
    method: "POST",
    token,
  });
}
