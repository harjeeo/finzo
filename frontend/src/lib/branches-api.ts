import { apiFetch } from "./api";

export interface Branch {
  id: string;
  name: string;
  address: string | null;
  isDefault: boolean;
}

export interface BranchInput {
  name: string;
  address?: string;
}

export function listBranches(token: string) {
  return apiFetch<Branch[]>("/branches", { token });
}

export function createBranch(token: string, input: BranchInput) {
  return apiFetch<Branch>("/branches", { method: "POST", body: input, token });
}

export function updateBranch(token: string, id: string, input: BranchInput) {
  return apiFetch<Branch>(`/branches/${id}`, {
    method: "PATCH",
    body: input,
    token,
  });
}

export function deleteBranch(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/branches/${id}`, {
    method: "DELETE",
    token,
  });
}
