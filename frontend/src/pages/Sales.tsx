import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Add01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listSalesInvoices, type SalesInvoice } from "../lib/sales-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-50 text-amber-700",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function Sales() {
  const { accessToken } = useAuth();
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listSalesInvoices(accessToken)
      .then(setInvoices)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Sales</h1>
        <Link
          to="/sales/new"
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          New Invoice
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : invoices.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No sales invoices yet. Create your first invoice to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
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
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ₹{invoice.grandTotal}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[invoice.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
