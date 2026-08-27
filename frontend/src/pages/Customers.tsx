import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "../lib/customers-api";
import { CustomerFormModal } from "../components/CustomerFormModal";

export function Customers() {
  const { accessToken } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; customer: Customer } | null
  >(null);

  const loadCustomers = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listCustomers(accessToken);
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (input: CustomerInput) => {
    if (!accessToken) return;
    if (modalState?.mode === "edit") {
      await updateCustomer(accessToken, modalState.customer.id, input);
    } else {
      await createCustomer(accessToken, input);
    }
    setModalState(null);
    await loadCustomers();
  };

  const handleDelete = async (customer: Customer) => {
    if (!accessToken) return;
    if (!confirm(`Delete customer "${customer.name}"?`)) return;
    await deleteCustomer(accessToken, customer.id);
    await loadCustomers();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Add Customer
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : customers.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No customers yet. Add your first customer to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">GSTIN</th>
                <th className="px-4 py-3 font-medium">Opening Balance</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {customer.gstin || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    ₹{customer.openingBalance}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setModalState({ mode: "edit", customer })
                        }
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Edit"
                      >
                        <PencilEdit01Icon size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(customer)}
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
        <CustomerFormModal
          customer={modalState.mode === "edit" ? modalState.customer : null}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
