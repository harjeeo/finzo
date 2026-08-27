import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { canManageCatalog, hasRole } from "../lib/permissions";
import {
  createSupplier,
  deleteSupplier,
  listSuppliers,
  updateSupplier,
  type Supplier,
  type SupplierInput,
} from "../lib/suppliers-api";
import { SupplierFormModal } from "../components/SupplierFormModal";

export function Suppliers() {
  const { accessToken, user } = useAuth();
  const canWrite = hasRole(user?.role, canManageCatalog);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; supplier: Supplier } | null
  >(null);

  const loadSuppliers = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listSuppliers(accessToken);
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (input: SupplierInput) => {
    if (!accessToken) return;
    if (modalState?.mode === "edit") {
      await updateSupplier(accessToken, modalState.supplier.id, input);
    } else {
      await createSupplier(accessToken, input);
    }
    setModalState(null);
    await loadSuppliers();
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!accessToken) return;
    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;
    await deleteSupplier(accessToken, supplier.id);
    await loadSuppliers();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Suppliers</h1>
        {canWrite && (
          <button
            onClick={() => setModalState({ mode: "create" })}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Add01Icon size={18} />
            Add Supplier
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : suppliers.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No suppliers yet. Add your first supplier to get started.
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
                {canWrite && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {supplier.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {supplier.phone || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {supplier.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {supplier.gstin || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    ₹{supplier.openingBalance}
                  </td>
                  {canWrite && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setModalState({ mode: "edit", supplier })
                          }
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          aria-label="Edit"
                        >
                          <PencilEdit01Icon size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(supplier)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <SupplierFormModal
          supplier={modalState.mode === "edit" ? modalState.supplier : null}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
