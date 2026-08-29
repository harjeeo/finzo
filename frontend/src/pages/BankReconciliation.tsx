import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import {
  getReconciliation,
  listBankAccounts,
  setLineReconciled,
  type Reconciliation,
} from "../lib/reconciliation-api";
import type { Account } from "../lib/accounting-api";

export function BankReconciliation() {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [data, setData] = useState<Reconciliation | null>(null);
  const [statementBalance, setStatementBalance] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listBankAccounts(accessToken).then((data) => {
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
      else setIsLoading(false);
    });
  }, [accessToken]);

  const load = async () => {
    if (!accessToken || !accountId) return;
    setIsLoading(true);
    try {
      const result = await getReconciliation(accessToken, accountId);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, accountId]);

  const handleToggle = async (lineId: string, current: boolean) => {
    if (!accessToken || !accountId) return;
    await setLineReconciled(accessToken, accountId, lineId, !current);
    await load();
  };

  const diff = statementBalance
    ? Number(statementBalance) - (data?.reconciledBalance ?? 0)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Bank Reconciliation</h1>

      {accounts.length === 0 && !isLoading ? (
        <p className="mt-4 text-sm text-gray-500">
          No bank accounts configured. Mark an account as a bank account in
          Accounting → Chart of Accounts to reconcile it here.
        </p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="mt-1 w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bank statement closing balance
              </label>
              <input
                type="number"
                step="0.01"
                value={statementBalance}
                onChange={(e) => setStatementBalance(e.target.value)}
                placeholder="Enter to compare"
                className="mt-1 w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {isLoading ? (
            <p className="mt-6 text-sm text-gray-500">Loading...</p>
          ) : data ? (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Book Balance</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">
                    ₹{data.bookBalance.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Reconciled Balance</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">
                    ₹{data.reconciledBalance.toFixed(2)}
                  </p>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    diff === null
                      ? "border-gray-200 bg-white"
                      : Math.abs(diff) < 0.01
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                  }`}
                >
                  <p className="text-sm text-gray-500">Difference vs Statement</p>
                  <p
                    className={`mt-2 text-xl font-semibold ${
                      diff === null
                        ? "text-gray-900"
                        : Math.abs(diff) < 0.01
                          ? "text-green-700"
                          : "text-red-700"
                    }`}
                  >
                    {diff === null ? "—" : `₹${diff.toFixed(2)}`}
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {data.entries.length === 0 ? (
                  <p className="p-6 text-sm text-gray-500">
                    No transactions posted to this account yet.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">Cleared</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Entry</th>
                        <th className="px-4 py-3 font-medium">Narration</th>
                        <th className="px-4 py-3 font-medium">Debit</th>
                        <th className="px-4 py-3 font-medium">Credit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.entries.map((line) => (
                        <tr
                          key={line.id}
                          className={line.isReconciled ? "bg-green-50/40" : undefined}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={line.isReconciled}
                              onChange={() => handleToggle(line.id, line.isReconciled)}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(line.entryDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{line.entryNumber}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {line.description ?? line.narration ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {line.debit > 0 ? `₹${line.debit.toFixed(2)}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {line.credit > 0 ? `₹${line.credit.toFixed(2)}` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
