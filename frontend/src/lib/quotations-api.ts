import { apiFetch } from "./api";
import type { Customer } from "./customers-api";

export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CONVERTED";

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
  taxAmount: string;
  lineTotal: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  quotationDate: string;
  validUntil: string | null;
  status: QuotationStatus;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  grandTotal: string;
  notes: string | null;
  customer: Customer;
  branch?: { id: string; name: string } | null;
  items?: QuotationItem[];
  convertedInvoice?: { id: string; invoiceNumber: string } | null;
}

export interface QuotationItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface QuotationInput {
  customerId: string;
  branchId?: string;
  validUntil?: string;
  discountTotal?: number;
  notes?: string;
  items: QuotationItemInput[];
}

export function listQuotations(token: string, branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return apiFetch<Quotation[]>(`/quotations${query}`, { token });
}

export function getQuotation(token: string, id: string) {
  return apiFetch<Quotation>(`/quotations/${id}`, { token });
}

export function createQuotation(token: string, input: QuotationInput) {
  return apiFetch<Quotation>("/quotations", {
    method: "POST",
    body: input,
    token,
  });
}

export function updateQuotationStatus(
  token: string,
  id: string,
  status: Exclude<QuotationStatus, "CONVERTED">,
) {
  return apiFetch<Quotation>(`/quotations/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export function convertQuotationToInvoice(token: string, id: string) {
  return apiFetch<{ quotation: Quotation; invoice: { id: string; invoiceNumber: string } }>(
    `/quotations/${id}/convert`,
    { method: "POST", token },
  );
}

export function deleteQuotation(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/quotations/${id}`, {
    method: "DELETE",
    token,
  });
}
