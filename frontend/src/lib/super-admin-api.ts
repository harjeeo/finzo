import { apiFetch } from "./api";

export interface PlatformStats {
  businessCount: number;
  activeBusinessCount: number;
  suspendedBusinessCount: number;
  userCount: number;
  newBusinessesThisMonth: number;
  salesThisMonth: { total: number; count: number };
}

export interface AdminBusinessListItem {
  id: string;
  name: string;
  gstin: string | null;
  city: string | null;
  state: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  owner: { name: string; email: string } | null;
  memberCount: number;
  salesInvoiceCount: number;
  purchaseBillCount: number;
}

export interface AdminBusinessDetail {
  id: string;
  name: string;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  members: {
    id: string;
    role: string;
    user: { id: string; name: string; email: string };
  }[];
  stats: {
    totalSales: number;
    salesInvoiceCount: number;
    totalPurchases: number;
    purchaseBillCount: number;
    customerCount: number;
    productCount: number;
  };
}

export function getPlatformStats(token: string) {
  return apiFetch<PlatformStats>("/admin/stats", { token });
}

export function listAllBusinesses(token: string) {
  return apiFetch<AdminBusinessListItem[]>("/admin/businesses", { token });
}

export function getBusinessDetail(token: string, id: string) {
  return apiFetch<AdminBusinessDetail>(`/admin/businesses/${id}`, { token });
}

export function updateBusinessStatus(
  token: string,
  id: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  return apiFetch<AdminBusinessDetail>(`/admin/businesses/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}
