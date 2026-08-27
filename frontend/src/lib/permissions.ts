export type Role = "OWNER" | "MANAGER" | "ACCOUNTANT" | "CASHIER" | "STAFF";

/** OWNER can always do everything, regardless of these lists. */
export function hasRole(
  userRole: string | null | undefined,
  allowedRoles: Role[],
): boolean {
  if (!userRole) return false;
  if (userRole === "OWNER") return true;
  return allowedRoles.includes(userRole as Role);
}

export const canManageCatalog: Role[] = ["MANAGER"]; // suppliers/products write
export const canManageCustomersWrite: Role[] = ["MANAGER"]; // edit/delete customers
export const canCreateCustomers: Role[] = ["MANAGER", "CASHIER"];
export const canAccessPurchase: Role[] = ["MANAGER", "ACCOUNTANT"];
export const canAccessExpenses: Role[] = ["MANAGER", "ACCOUNTANT"];
export const canAccessReports: Role[] = ["MANAGER", "ACCOUNTANT"];
export const canAccessStaff: Role[] = ["MANAGER"];
export const canDeleteSales: Role[] = ["MANAGER"];
