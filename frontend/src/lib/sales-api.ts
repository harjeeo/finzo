import { apiFetch } from "./api";
import type { Customer } from "./customers-api";

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
  taxAmount: string;
  lineTotal: string;
}

export interface SalesPayment {
  id: string;
  amount: string;
  paymentMode: string;
  reference: string | null;
  paymentDate: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: string;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  grandTotal: string;
  amountPaid: string;
  paymentMode: string | null;
  customer: Customer;
  items?: SalesInvoiceItem[];
  payments?: SalesPayment[];
}

export interface PaymentInput {
  amount: number;
  paymentMode?: string;
  reference?: string;
  paymentDate?: string;
}

export interface SalesInvoiceItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
}

export interface SalesInvoiceInput {
  customerId: string;
  discountTotal?: number;
  amountPaid?: number;
  paymentMode?: string;
  items: SalesInvoiceItemInput[];
}

export function listSalesInvoices(token: string) {
  return apiFetch<SalesInvoice[]>("/sales-invoices", { token });
}

export function getSalesInvoice(token: string, id: string) {
  return apiFetch<SalesInvoice>(`/sales-invoices/${id}`, { token });
}

export function createSalesInvoice(token: string, input: SalesInvoiceInput) {
  return apiFetch<SalesInvoice>("/sales-invoices", {
    method: "POST",
    body: input,
    token,
  });
}

export function deleteSalesInvoice(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/sales-invoices/${id}`, {
    method: "DELETE",
    token,
  });
}

export function addSalesPayment(
  token: string,
  id: string,
  input: PaymentInput,
) {
  return apiFetch<SalesInvoice>(`/sales-invoices/${id}/payments`, {
    method: "POST",
    body: input,
    token,
  });
}
