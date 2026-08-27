import { Link } from "react-router-dom";
import { ArrowLeft01Icon } from "hugeicons-react";
import type { LedgerEntry } from "../lib/ledger-api";

interface Party {
  name: string;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
}

interface LedgerViewProps {
  backTo: string;
  backLabel: string;
  party: Party;
  openingBalance: number;
  outstandingBalance: number;
  transactions: LedgerEntry[];
}

export function LedgerView({
  backTo,
  backLabel,
  party,
  openingBalance,
  outstandingBalance,
  transactions,
}: LedgerViewProps) {
  return (
    <div>
      <Link
        to={backTo}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft01Icon size={16} />
        {backLabel}
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{party.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {[party.phone, party.email, party.gstin].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p
            className={`text-xl font-semibold ${
              outstandingBalance > 0
                ? "text-red-600"
                : outstandingBalance < 0
                  ? "text-green-600"
                  : "text-gray-900"
            }`}
          >
            ₹{outstandingBalance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 text-right font-medium">Debit</th>
              <th className="px-4 py-3 text-right font-medium">Credit</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-3 text-gray-500" colSpan={5}>
                Opening Balance
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                ₹{openingBalance.toFixed(2)}
              </td>
            </tr>
            {transactions.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={6}>
                  No transactions yet.
                </td>
              </tr>
            ) : (
              transactions.map((entry, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(entry.date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{entry.type}</td>
                  <td className="px-4 py-3 text-gray-600">{entry.reference}</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ₹{entry.balance.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
