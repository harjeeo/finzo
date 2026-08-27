import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Customers } from "../pages/Customers";
import { Suppliers } from "../pages/Suppliers";
import { Products } from "../pages/Products";
import { Sales } from "../pages/Sales";
import { NewSalesInvoice } from "../pages/NewSalesInvoice";
import { SalesInvoiceDetail } from "../pages/SalesInvoiceDetail";
import { Purchase } from "../pages/Purchase";
import { NewPurchaseBill } from "../pages/NewPurchaseBill";
import { PurchaseBillDetail } from "../pages/PurchaseBillDetail";
import { Expenses } from "../pages/Expenses";
import { Reports } from "../pages/Reports";
import { Staff } from "../pages/Staff";
import { Settings } from "../pages/Settings";
import { Billing } from "../pages/Billing";
import { SalesInvoicePrint } from "../pages/SalesInvoicePrint";
import { PurchaseBillPrint } from "../pages/PurchaseBillPrint";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { RequireRole } from "./RequireRole";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/login", element: <Login /> },
          { path: "/register", element: <Register /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "sales/:id/print", element: <SalesInvoicePrint /> },
      { path: "purchase/:id/print", element: <PurchaseBillPrint /> },
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "customers", element: <Customers /> },
          { path: "suppliers", element: <Suppliers /> },
          { path: "products", element: <Products /> },
          { path: "sales", element: <Sales /> },
          { path: "sales/new", element: <NewSalesInvoice /> },
          { path: "sales/:id", element: <SalesInvoiceDetail /> },
          { path: "billing", element: <Billing /> },
          {
            element: <RequireRole roles={["MANAGER", "ACCOUNTANT"]} />,
            children: [
              { path: "purchase", element: <Purchase /> },
              { path: "purchase/new", element: <NewPurchaseBill /> },
              { path: "purchase/:id", element: <PurchaseBillDetail /> },
              { path: "expenses", element: <Expenses /> },
              { path: "reports", element: <Reports /> },
            ],
          },
          {
            element: <RequireRole roles={["MANAGER"]} />,
            children: [
              { path: "staff", element: <Staff /> },
              { path: "settings", element: <Settings /> },
            ],
          },
        ],
      },
    ],
  },
]);
