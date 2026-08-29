import { apiFetch } from "./api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Gstr1Row {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  gstin: string | null;
  supplyType: "B2B" | "B2C";
  placeOfSupply: string | null;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  invoiceValue: number;
}

export interface Gstr1Report {
  from: string | null;
  to: string | null;
  businessGstin: string | null;
  rows: Gstr1Row[];
  totals: {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    invoiceValue: number;
  };
}

export interface Gstr3bSummary {
  from: string | null;
  to: string | null;
  outward: { taxableValue: number; igst: number; cgst: number; sgst: number; total: number };
  inwardItc: { taxableValue: number; igst: number; cgst: number; sgst: number; total: number };
  netTaxPayable: { igst: number; cgst: number; sgst: number; total: number };
}

function buildQuery(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getGstr1(token: string, from?: string, to?: string) {
  return apiFetch<Gstr1Report>(`/reports/gstr1${buildQuery(from, to)}`, { token });
}

export function getGstr3b(token: string, from?: string, to?: string) {
  return apiFetch<Gstr3bSummary>(`/reports/gstr3b${buildQuery(from, to)}`, { token });
}

export async function downloadGstr1Csv(token: string, from?: string, to?: string) {
  const response = await fetch(`${API_URL}/reports/gstr1/export${buildQuery(from, to)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error("Failed to export GSTR-1");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `GSTR1_${from ?? "all"}_${to ?? "all"}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
