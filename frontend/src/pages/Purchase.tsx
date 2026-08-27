import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Add01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listPurchaseBills, type PurchaseBill } from "../lib/purchases-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  UNPAID: "bg-amber-50 text-amber-700",
  PARTIALLY_PAID: "bg-blue-50 text-blue-700",
  PAID: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function Purchase() {
  const { accessToken } = useAuth();
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listPurchaseBills(accessToken)
      .then(setBills)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Purchase</h1>
        <Link
          to="/purchase/new"
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          New Purchase Bill
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : bills.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No purchase bills yet. Create your first bill to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Bill #</th>
                <th className="px-4 py-3 font-medium">Supplier</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/purchase/${bill.id}`}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      {bill.billNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {bill.supplier.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(bill.billDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ₹{bill.grandTotal}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[bill.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {bill.status}
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
