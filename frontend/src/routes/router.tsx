import { createBrowserRouter } from "react-router-dom";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { Dashboard } from "../pages/Dashboard";
import { PlaceholderPage } from "../pages/PlaceholderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: "customers",
        element: <PlaceholderPage title="Customers" />,
      },
      {
        path: "suppliers",
        element: <PlaceholderPage title="Suppliers" />,
      },
      { path: "products", element: <PlaceholderPage title="Products" /> },
      { path: "sales", element: <PlaceholderPage title="Sales" /> },
      { path: "purchase", element: <PlaceholderPage title="Purchase" /> },
      { path: "billing", element: <PlaceholderPage title="Billing / POS" /> },
      { path: "expenses", element: <PlaceholderPage title="Expenses" /> },
      { path: "reports", element: <PlaceholderPage title="Reports" /> },
      { path: "staff", element: <PlaceholderPage title="Staff" /> },
      { path: "settings", element: <PlaceholderPage title="Settings" /> },
    ],
  },
]);
