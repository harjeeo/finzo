import {
  DashboardSquare01Icon,
  UserGroupIcon,
  TruckDeliveryIcon,
  Package01Icon,
  ShoppingCart01Icon,
  Invoice01Icon,
  ReceiptDollarIcon,
  Wallet01Icon,
  Analytics01Icon,
  UserMultipleIcon,
  Setting07Icon,
  Building03Icon,
  Calculator01Icon,
  FileSecurityIcon,
  WarehouseIcon,
  PackageMoving01Icon,
  HourglassIcon,
  Note01Icon,
} from "hugeicons-react";
import type { HugeiconsIconProps } from "@hugeicons/react";
import type { ReactElement } from "react";
import type { Role } from "../lib/permissions";

export interface NavItem {
  label: string;
  path: string;
  icon: (props: Omit<HugeiconsIconProps, "icon">) => ReactElement;
  /** Roles allowed to see this item, in addition to OWNER. Omit for "everyone". */
  roles?: Role[];
}

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: DashboardSquare01Icon },
  { label: "Customers", path: "/customers", icon: UserGroupIcon },
  { label: "Suppliers", path: "/suppliers", icon: TruckDeliveryIcon },
  { label: "Products", path: "/products", icon: Package01Icon },
  { label: "Quotations", path: "/quotations", icon: Note01Icon },
  { label: "Sales", path: "/sales", icon: ShoppingCart01Icon },
  {
    label: "Purchase",
    path: "/purchase",
    icon: Invoice01Icon,
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  { label: "Billing", path: "/billing", icon: ReceiptDollarIcon },
  {
    label: "Expenses",
    path: "/expenses",
    icon: Wallet01Icon,
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Reports",
    path: "/reports",
    icon: Analytics01Icon,
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Accounting",
    path: "/accounting",
    icon: Calculator01Icon,
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Branches",
    path: "/branches",
    icon: Building03Icon,
    roles: ["MANAGER"],
  },
  {
    label: "Godowns",
    path: "/godowns",
    icon: WarehouseIcon,
    roles: ["MANAGER"],
  },
  {
    label: "Stock Transfers",
    path: "/stock-transfers",
    icon: PackageMoving01Icon,
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Expiry Report",
    path: "/expiry-report",
    icon: HourglassIcon,
    roles: ["MANAGER", "ACCOUNTANT"],
  },
  {
    label: "Staff",
    path: "/staff",
    icon: UserMultipleIcon,
    roles: ["MANAGER"],
  },
  {
    label: "Audit Trail",
    path: "/audit-log",
    icon: FileSecurityIcon,
    roles: ["MANAGER"],
  },
  { label: "Settings", path: "/settings", icon: Setting07Icon, roles: ["MANAGER"] },
];
