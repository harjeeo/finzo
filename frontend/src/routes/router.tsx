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
import { Accounting } from "../pages/Accounting";
import { Staff } from "../pages/Staff";
import { Branches } from "../pages/Branches";
import { Settings } from "../pages/Settings";
import { Billing } from "../pages/Billing";
import { SalesInvoicePrint } from "../pages/SalesInvoicePrint";
import { PurchaseBillPrint } from "../pages/PurchaseBillPrint";
import { EwayBillPrint } from "../pages/EwayBillPrint";
import { AuditLog } from "../pages/AuditLog";
import { Godowns } from "../pages/Godowns";
import { StockTransfers } from "../pages/StockTransfers";
import { ExpiryReport } from "../pages/ExpiryReport";
import { Quotations } from "../pages/Quotations";
import { NewQuotation } from "../pages/NewQuotation";
import { QuotationDetail } from "../pages/QuotationDetail";
import { QuotationPrint } from "../pages/QuotationPrint";
import { GstReports } from "../pages/GstReports";
import { PurchaseOrders } from "../pages/PurchaseOrders";
import { NewPurchaseOrder } from "../pages/NewPurchaseOrder";
import { PurchaseOrderDetail } from "../pages/PurchaseOrderDetail";
import { PurchaseOrderPrint } from "../pages/PurchaseOrderPrint";
import { DeliveryChallans } from "../pages/DeliveryChallans";
import { NewDeliveryChallan } from "../pages/NewDeliveryChallan";
import { DeliveryChallanDetail } from "../pages/DeliveryChallanDetail";
import { DeliveryChallanPrint } from "../pages/DeliveryChallanPrint";
import { BankReconciliation } from "../pages/BankReconciliation";
import { PriceLists } from "../pages/PriceLists";
import { DiscountSchemes } from "../pages/DiscountSchemes";
import { CustomerLedgerPage } from "../pages/CustomerLedgerPage";
import { SupplierLedgerPage } from "../pages/SupplierLedgerPage";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { AdminBusinesses } from "../pages/admin/AdminBusinesses";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import { RequireRole } from "./RequireRole";
import { RequireSuperAdmin } from "./RequireSuperAdmin";

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
      { path: "sales/:id/eway-bill/print", element: <EwayBillPrint /> },
      { path: "purchase/:id/print", element: <PurchaseBillPrint /> },
      { path: "quotations/:id/print", element: <QuotationPrint /> },
      { path: "purchase-orders/:id/print", element: <PurchaseOrderPrint /> },
      { path: "delivery-challans/:id/print", element: <DeliveryChallanPrint /> },
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "customers", element: <Customers /> },
          { path: "customers/:id", element: <CustomerLedgerPage /> },
          { path: "suppliers", element: <Suppliers /> },
          { path: "suppliers/:id", element: <SupplierLedgerPage /> },
          { path: "products", element: <Products /> },
          { path: "quotations", element: <Quotations /> },
          { path: "quotations/new", element: <NewQuotation /> },
          { path: "quotations/:id", element: <QuotationDetail /> },
          { path: "delivery-challans", element: <DeliveryChallans /> },
          { path: "delivery-challans/new", element: <NewDeliveryChallan /> },
          { path: "delivery-challans/:id", element: <DeliveryChallanDetail /> },
          { path: "sales", element: <Sales /> },
          { path: "sales/new", element: <NewSalesInvoice /> },
          { path: "sales/:id", element: <SalesInvoiceDetail /> },
          { path: "billing", element: <Billing /> },
          {
            element: <RequireRole roles={["MANAGER", "ACCOUNTANT"]} />,
            children: [
              { path: "purchase-orders", element: <PurchaseOrders /> },
              { path: "purchase-orders/new", element: <NewPurchaseOrder /> },
              { path: "purchase-orders/:id", element: <PurchaseOrderDetail /> },
              { path: "purchase", element: <Purchase /> },
              { path: "purchase/new", element: <NewPurchaseBill /> },
              { path: "purchase/:id", element: <PurchaseBillDetail /> },
              { path: "expenses", element: <Expenses /> },
              { path: "reports", element: <Reports /> },
              { path: "gst-reports", element: <GstReports /> },
              { path: "accounting", element: <Accounting /> },
              { path: "bank-reconciliation", element: <BankReconciliation /> },
              { path: "price-lists", element: <PriceLists /> },
              { path: "discount-schemes", element: <DiscountSchemes /> },
              { path: "stock-transfers", element: <StockTransfers /> },
              { path: "expiry-report", element: <ExpiryReport /> },
            ],
          },
          {
            element: <RequireRole roles={["MANAGER"]} />,
            children: [
              { path: "staff", element: <Staff /> },
              { path: "settings", element: <Settings /> },
              { path: "branches", element: <Branches /> },
              { path: "godowns", element: <Godowns /> },
              { path: "audit-log", element: <AuditLog /> },
            ],
          },
        ],
      },
      {
        element: <RequireSuperAdmin />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: "businesses", element: <AdminBusinesses /> },
            ],
          },
        ],
      },
    ],
  },
]);
