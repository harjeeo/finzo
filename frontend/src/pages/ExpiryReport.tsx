import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { getExpiryReport, type ExpiryReportEntry } from "../lib/inventory-api";

const STATUS_STYLES: Record<ExpiryReportEntry["status"], string> = {
  OK: "bg-green-50 text-green-700",
  EXPIRING_SOON: "bg-amber-50 text-amber-700",
  EXPIRED: "bg-red-50 text-red-700",
};

export function ExpiryReport() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<ExpiryReportEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withinDays, setWithinDays] = useState(60);

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      setEntries(await getExpiryReport(accessToken, withinDays));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Batch Expiry Report</h1>
      <p className="mt-1 text-sm text-gray-500">
        Batches with remaining stock, nearest expiry first.
      </p>

      <div className="mt-4 flex items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Expiring within (days)
          </label>
          <input
            type="number"
            min="1"
            value={withinDays}
            onChange={(e) => setWithinDays(Number(e.target.value))}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={load}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Apply
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No batch-tracked stock with an expiry date yet.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Batch #</th>
                <th className="px-4 py-3 font-medium">Expiry Date</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Godowns</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.batchId}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {entry.productName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.batchNumber}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.expiryDate
                      ? new Date(entry.expiryDate).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.totalQuantity} {entry.unit}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.stocks.map((s) => `${s.godownName} (${s.quantity})`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[entry.status]}`}
                    >
                      {entry.status.replace("_", " ")}
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
