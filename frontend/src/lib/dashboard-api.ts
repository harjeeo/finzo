import { apiFetch } from "./api";
import type { SalesInvoice } from "./sales-api";

export interface DashboardSummary {
  todaySales: number;
  todayPurchases: number;
  receivables: number;
  payables: number;
  lowStockCount: number;
  recentSalesInvoices: SalesInvoice[];
}

export function getDashboardSummary(token: string) {
  return apiFetch<DashboardSummary>("/dashboard/summary", { token });
}
