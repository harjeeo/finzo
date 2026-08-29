import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Add01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listQuotations, type Quotation } from "../lib/quotations-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  CONVERTED: "bg-purple-50 text-purple-700",
};

export function Quotations() {
  const { accessToken } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listQuotations(accessToken)
      .then(setQuotations)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Quotations</h1>
        <Link
          to="/quotations/new"
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          New Quotation
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : quotations.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No quotations yet. Create your first quotation to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Quotation #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/quotations/${q.id}`}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      {q.quotationNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{q.customer.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(q.quotationDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ₹{q.grandTotal}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[q.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {q.status}
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
