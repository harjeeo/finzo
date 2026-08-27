import { apiFetch } from "./api";

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  summary: string | null;
  changes: unknown;
  createdAt: string;
}

export function listAuditLog(
  token: string,
  filters: { entityType?: string; from?: string; to?: string } = {},
) {
  const params = new URLSearchParams();
  if (filters.entityType) params.set("entityType", filters.entityType);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return apiFetch<AuditLogEntry[]>(`/audit-log${query ? `?${query}` : ""}`, {
    token,
  });
}
