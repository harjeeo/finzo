import { apiFetch } from "./api";

export interface ProductStockEntry {
  godownId: string;
  godownName: string;
  branchName: string;
  batchId: string | null;
  batchNumber: string | null;
  expiryDate: string | null;
  quantity: number;
}

export type ExpiryStatus = "OK" | "EXPIRING_SOON" | "EXPIRED";

export interface ExpiryReportEntry {
  batchId: string;
  batchNumber: string;
  productId: string;
  productName: string;
  unit: string;
  expiryDate: string | null;
  totalQuantity: number;
  status: ExpiryStatus;
  stocks: { godownId: string; godownName: string; quantity: number }[];
}

export interface StockTransfer {
  id: string;
  quantity: string;
  transferDate: string;
  notes: string | null;
  product: { id: string; name: string; unit: string };
  batch: { id: string; batchNumber: string } | null;
  fromGodown: { id: string; name: string };
  toGodown: { id: string; name: string };
}

export interface StockTransferInput {
  productId: string;
  batchId?: string;
  fromGodownId: string;
  toGodownId: string;
  quantity: number;
  notes?: string;
}

export function getProductStock(token: string, productId: string) {
  return apiFetch<ProductStockEntry[]>(`/products/${productId}/stock`, {
    token,
  });
}

export function getExpiryReport(token: string, withinDays?: number) {
  const query = withinDays ? `?withinDays=${withinDays}` : "";
  return apiFetch<ExpiryReportEntry[]>(`/batches/expiry-report${query}`, {
    token,
  });
}

export function listStockTransfers(token: string) {
  return apiFetch<StockTransfer[]>("/stock-transfers", { token });
}

export function createStockTransfer(token: string, input: StockTransferInput) {
  return apiFetch<StockTransfer>("/stock-transfers", {
    method: "POST",
    body: input,
    token,
  });
}
