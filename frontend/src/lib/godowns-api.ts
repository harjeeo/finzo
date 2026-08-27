import { apiFetch } from "./api";

export interface Godown {
  id: string;
  branchId: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  branch?: { id: string; name: string };
}

export interface GodownInput {
  branchId: string;
  name: string;
  address?: string;
}

export function listGodowns(token: string, branchId?: string) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  return apiFetch<Godown[]>(`/godowns${query}`, { token });
}

export function createGodown(token: string, input: GodownInput) {
  return apiFetch<Godown>("/godowns", { method: "POST", body: input, token });
}

export function updateGodown(
  token: string,
  id: string,
  input: Partial<Omit<GodownInput, "branchId">>,
) {
  return apiFetch<Godown>(`/godowns/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteGodown(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/godowns/${id}`, {
    method: "DELETE",
    token,
  });
}
