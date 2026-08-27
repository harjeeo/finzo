import { Fragment, useEffect, useState } from "react";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../../lib/auth-context";
import {
  createJournalEntry,
  deleteJournalEntry,
  listJournalEntries,
  type Account,
  type JournalEntry,
  type JournalLineInput,
} from "../../lib/accounting-api";

interface Props {
  accounts: Account[];
}

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  SALES_INVOICE: "Sales Invoice",
  SALES_PAYMENT: "Sales Payment",
  SALES_RETURN: "Sales Return",
  PURCHASE_BILL: "Purchase Bill",
  PURCHASE_PAYMENT: "Purchase Payment",
  PURCHASE_RETURN: "Purchase Return",
  EXPENSE: "Expense",
};

function emptyLine(): JournalLineInput {
  return { accountId: "", debit: undefined, credit: undefined };
}

export function JournalEntriesTab({ accounts }: Props) {
  const { accessToken } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [narration, setNarration] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [lines, setLines] = useState<JournalLineInput[]>([
    emptyLine(),
    emptyLine(),
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEntries = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      setEntries(await listJournalEntries(accessToken));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit ?? 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit ?? 0), 0);
  const isBalanced =
    lines.some((l) => l.debit || l.credit) &&
    Math.abs(totalDebit - totalCredit) < 0.01;

  const updateLine = (index: number, patch: Partial<JournalLineInput>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (index: number) =>
    setLines((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setNarration("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setLines([emptyLine(), emptyLine()]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setError(null);
    if (!isBalanced) {
      setError("Total debit must equal total credit");
      return;
    }
    const validLines = lines.filter((l) => l.accountId && (l.debit || l.credit));
    if (validLines.length < 2) {
      setError("Add at least two lines");
      return;
    }

    setIsSubmitting(true);
    try {
      await createJournalEntry(accessToken, {
        entryDate,
        narration: narration || undefined,
        lines: validLines,
      });
      setShowModal(false);
      resetForm();
      await loadEntries();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (entry: JournalEntry) => {
    if (!accessToken) return;
    if (!confirm(`Delete journal entry ${entry.entryNumber}?`)) return;
    try {
      await deleteJournalEntry(accessToken, entry.id);
      await loadEntries();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete entry");
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
          New Entry
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No journal entries yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Entry #</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Narration</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const total = entry.lines.reduce(
                  (sum, l) => sum + Number(l.debit),
                  0,
                );
                const isExpanded = expandedId === entry.id;
                return (
                  <Fragment key={entry.id}>
                    <tr
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : entry.id)
                      }
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {entry.entryNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.narration || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          {SOURCE_LABEL[entry.sourceType] ?? entry.sourceType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹{total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {entry.sourceType === "MANUAL" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry);
                            }}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            aria-label="Delete"
                          >
                            <Delete02Icon size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 px-4 py-3">
                          <table className="w-full text-left text-xs">
                            <thead className="text-gray-500">
                              <tr>
                                <th className="py-1 font-medium">Account</th>
                                <th className="py-1 font-medium">Debit</th>
                                <th className="py-1 font-medium">Credit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entry.lines.map((line) => (
                                <tr key={line.id}>
                                  <td className="py-1 text-gray-700">
                                    {line.account.code} — {line.account.name}
                                  </td>
                                  <td className="py-1 text-gray-700">
                                    {Number(line.debit) > 0
                                      ? `₹${Number(line.debit).toFixed(2)}`
                                      : ""}
                                  </td>
                                  <td className="py-1 text-gray-700">
                                    {Number(line.credit) > 0
                                      ? `₹${Number(line.credit).toFixed(2)}`
                                      : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900">
              New Journal Entry
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Narration
                </label>
                <input
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Lines</h3>
                <button
                  onClick={addLine}
                  className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
                >
                  <Add01Icon size={16} />
                  Add line
                </button>
              </div>

              <div className="space-y-2">
                {lines.map((line, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={line.accountId}
                      onChange={(e) =>
                        updateLine(index, { accountId: e.target.value })
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select account</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} — {a.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.debit ?? ""}
                      onChange={(e) =>
                        updateLine(index, {
                          debit: e.target.value ? Number(e.target.value) : undefined,
                          credit: e.target.value ? undefined : line.credit,
                        })
                      }
                      placeholder="Debit"
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.credit ?? ""}
                      onChange={(e) =>
                        updateLine(index, {
                          credit: e.target.value ? Number(e.target.value) : undefined,
                          debit: e.target.value ? undefined : line.debit,
                        })
                      }
                      placeholder="Credit"
                      className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => removeLine(index)}
                      disabled={lines.length <= 2}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Remove line"
                    >
                      <Delete02Icon size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-end gap-6 border-t border-gray-200 pt-3 text-sm">
                <span className="text-gray-600">
                  Debit: <span className="font-medium text-gray-900">₹{totalDebit.toFixed(2)}</span>
                </span>
                <span className="text-gray-600">
                  Credit: <span className="font-medium text-gray-900">₹{totalCredit.toFixed(2)}</span>
                </span>
                <span className={isBalanced ? "text-green-600" : "text-red-600"}>
                  {isBalanced ? "Balanced" : "Not balanced"}
                </span>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Post Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
