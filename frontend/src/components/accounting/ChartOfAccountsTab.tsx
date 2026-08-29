import { useState, type FormEvent } from "react";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../../lib/auth-context";
import {
  createAccount,
  deleteAccount,
  type Account,
  type AccountType,
} from "../../lib/accounting-api";

const ACCOUNT_TYPES: AccountType[] = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
];

const TYPE_LABEL: Record<AccountType, string> = {
  ASSET: "Asset",
  LIABILITY: "Liability",
  EQUITY: "Equity",
  INCOME: "Income",
  EXPENSE: "Expense",
};

interface Props {
  accounts: Account[];
  onChanged: () => void;
}

export function ChartOfAccountsTab({ accounts, onChanged }: Props) {
  const { accessToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("EXPENSE");
  const [isBankAccount, setIsBankAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createAccount(accessToken, { code, name, type, isBankAccount });
      setShowModal(false);
      setCode("");
      setName("");
      setType("EXPENSE");
      setIsBankAccount(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (account: Account) => {
    if (!accessToken) return;
    if (!confirm(`Delete account "${account.name}"?`)) return;
    try {
      await deleteAccount(accessToken, account.id);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Add Account
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {account.code}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {account.name}
                  {account.isSystem && (
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      System
                    </span>
                  )}
                  {account.isBankAccount && (
                    <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                      Bank
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {TYPE_LABEL[account.type]}
                </td>
                <td className="px-4 py-3">
                  {!account.isSystem && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(account)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Delete02Icon size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">Add Account</h2>
            <form className="mt-4 space-y-3" onSubmit={handleCreate}>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Code *
                </label>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isBankAccount}
                  onChange={(e) => setIsBankAccount(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Mark as a bank/cash account (enables reconciliation)
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
