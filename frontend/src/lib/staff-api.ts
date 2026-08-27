import { apiFetch } from "./api";

export interface StaffMember {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  role: string;
}

export function listStaff(token: string) {
  return apiFetch<StaffMember[]>("/staff", { token });
}

export function createStaff(token: string, input: CreateStaffInput) {
  return apiFetch<StaffMember>("/staff", { method: "POST", body: input, token });
}

export function updateStaffRole(token: string, id: string, role: string) {
  return apiFetch<StaffMember>(`/staff/${id}`, {
    method: "PATCH",
    body: { role },
    token,
  });
}

export function removeStaff(token: string, id: string) {
  return apiFetch<{ success: boolean }>(`/staff/${id}`, {
    method: "DELETE",
    token,
  });
}
