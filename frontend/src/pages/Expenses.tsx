import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from "../lib/expenses-api";
import { ExpenseFormModal } from "../components/ExpenseFormModal";

export function Expenses() {
  const { accessToken } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; expense: Expense } | null
  >(null);

  const loadExpenses = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listExpenses(accessToken);
      setExpenses(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (input: ExpenseInput) => {
    if (!accessToken) return;
    if (modalState?.mode === "edit") {
      await updateExpense(accessToken, modalState.expense.id, input);
    } else {
      await createExpense(accessToken, input);
    }
    setModalState(null);
    await loadExpenses();
  };

  const handleDelete = async (expense: Expense) => {
    if (!accessToken) return;
    if (!confirm(`Delete expense "${expense.category}"?`)) return;
    await deleteExpense(accessToken, expense.id);
    await loadExpenses();
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Add Expense
        </button>
      </div>

      {expenses.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            ₹{total.toFixed(2)}
          </p>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : expenses.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No expenses yet. Add your first expense to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Payment Mode</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {expense.category}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(expense.expenseDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {expense.paymentMode}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {expense.reference || "-"}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    ₹{expense.amount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setModalState({ mode: "edit", expense })
                        }
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Edit"
                      >
                        <PencilEdit01Icon size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete"
                      >
                        <Delete02Icon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <ExpenseFormModal
          expense={modalState.mode === "edit" ? modalState.expense : null}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
