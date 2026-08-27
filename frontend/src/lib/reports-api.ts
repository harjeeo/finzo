import { apiFetch } from "./api";

export interface ReportSummary {
  range: { from: string; to: string };
  sales: { total: number; subtotal: number; tax: number; count: number };
  purchases: { total: number; subtotal: number; tax: number; count: number };
  expenses: { total: number; count: number };
  netProfit: number;
}

export interface StockReportItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  currentStock: string;
  purchasePrice: string;
  sellingPrice: string;
  stockValue: number;
}

export interface StockReport {
  items: StockReportItem[];
  totalStockValue: number;
}

export function getReportSummary(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return apiFetch<ReportSummary>(
    `/reports/summary${query ? `?${query}` : ""}`,
    { token },
  );
}

export function getStockReport(token: string) {
  return apiFetch<StockReport>("/reports/stock", { token });
}
