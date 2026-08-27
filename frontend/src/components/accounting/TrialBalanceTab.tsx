import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { getTrialBalance, type TrialBalance } from "../../lib/accounting-api";

export function TrialBalanceTab() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<TrialBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getTrialBalance(accessToken)
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading...</p>;
  }
  if (!data) {
    return null;
  }

  const isBalanced = Math.abs(data.totalDebit - data.totalCredit) < 0.01;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Debit</th>
              <th className="px-4 py-3 font-medium">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {row.code}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {row.name}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : ""}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
              <td className="px-4 py-3" colSpan={2}>
                Total
              </td>
              <td className="px-4 py-3">₹{data.totalDebit.toFixed(2)}</td>
              <td className="px-4 py-3">₹{data.totalCredit.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p
        className={`mt-3 text-sm font-medium ${
          isBalanced ? "text-green-600" : "text-red-600"
        }`}
      >
        {isBalanced
          ? "Books are balanced"
          : "Books are not balanced — this should not happen, please review journal entries."}
      </p>
    </div>
  );
}
