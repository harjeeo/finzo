import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { listAuditLog, type AuditLogEntry } from "../lib/audit-api";

const ENTITY_TYPES = [
  "Customer",
  "Supplier",
  "Product",
  "Staff",
  "Business",
  "SalesInvoice",
  "PurchaseBill",
  "JournalEntry",
  "EwayBill",
];

const ACTION_STYLES: Record<AuditLogEntry["action"], string> = {
  CREATE: "bg-green-50 text-green-700",
  UPDATE: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

export function AuditLog() {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [entityType, setEntityType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      setEntries(
        await listAuditLog(accessToken, {
          entityType: entityType || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
      );
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
      <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
      <p className="mt-1 text-sm text-gray-500">
        Every create, update, and delete across the business, with who did it
        and when.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Entity
          </label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
          <p className="p-6 text-sm text-gray-500">No audit events found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Summary</th>
                <th className="px-4 py-3 font-medium">By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  onClick={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(entry.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLES[entry.action]}`}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.entityType}</td>
                  <td className="px-4 py-3 text-gray-900">
                    {entry.summary || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {entry.userEmail || "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {expandedId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setExpandedId(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-50 p-4 text-xs text-gray-700">
              {JSON.stringify(
                entries.find((e) => e.id === expandedId)?.changes,
                null,
                2,
              )}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setExpandedId(null)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
