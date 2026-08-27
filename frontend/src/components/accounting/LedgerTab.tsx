import { useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { getLedger, type Account, type Ledger } from "../../lib/accounting-api";

interface Props {
  accounts: Account[];
}

export function LedgerTab({ accounts }: Props) {
  const { accessToken } = useAuth();
  const [accountId, setAccountId] = useState("");
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (id: string) => {
    setAccountId(id);
    setLedger(null);
    if (!accessToken || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      setLedger(await getLedger(accessToken, id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="max-w-sm">
        <label className="block text-sm font-medium text-gray-700">
          Account
        </label>
        <select
          value={accountId}
          onChange={(e) => handleSelect(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        >
          <option value="">Select an account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}

      {ledger && (
        <div className="mt-4">
          <div className="mb-3 flex gap-6 text-sm">
            <span className="text-gray-600">
              Opening Balance:{" "}
              <span className="font-medium text-gray-900">
                ₹{ledger.openingBalance.toFixed(2)}
              </span>
            </span>
            <span className="text-gray-600">
              Closing Balance:{" "}
              <span className="font-medium text-gray-900">
                ₹{ledger.closingBalance.toFixed(2)}
              </span>
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Entry #</th>
                  <th className="px-4 py-3 font-medium">Narration</th>
                  <th className="px-4 py-3 font-medium">Debit</th>
                  <th className="px-4 py-3 font-medium">Credit</th>
                  <th className="px-4 py-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ledger.entries.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(line.entryDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {line.entryNumber}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {line.description || line.narration || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {line.debit > 0 ? `₹${line.debit.toFixed(2)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {line.credit > 0 ? `₹${line.credit.toFixed(2)}` : ""}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ₹{line.balance.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {ledger.entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      No transactions posted to this account yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
