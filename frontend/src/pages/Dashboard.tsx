import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../lib/dashboard-api";

export function Dashboard() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardSummary(accessToken)
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const stats = [
    { label: "Today's Sales", value: `₹${(summary?.todaySales ?? 0).toFixed(2)}` },
    {
      label: "Today's Purchases",
      value: `₹${(summary?.todayPurchases ?? 0).toFixed(2)}`,
    },
    { label: "Receivables", value: `₹${(summary?.receivables ?? 0).toFixed(2)}` },
    { label: "Payables", value: `₹${(summary?.payables ?? 0).toFixed(2)}` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {isLoading ? "..." : stat.value}
            </p>
          </div>
        ))}
      </div>

      {!isLoading && summary && summary.lowStockCount > 0 && (
        <Link
          to="/products"
          className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm"
        >
          <span className="font-medium text-red-700">
            {summary.lowStockCount} product
            {summary.lowStockCount > 1 ? "s" : ""} running low on stock
          </span>
          <span className="text-red-600 hover:underline">View products →</span>
        </Link>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">
            Recent Sales Invoices
          </h2>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : !summary || summary.recentSalesInvoices.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No sales invoices yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.recentSalesInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/sales/${invoice.id}`}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {invoice.customer.name}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ₹{invoice.grandTotal}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{invoice.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
