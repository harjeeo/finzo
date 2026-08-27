import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createGodown,
  deleteGodown,
  listGodowns,
  updateGodown,
  type Godown,
  type GodownInput,
} from "../lib/godowns-api";
import { listBranches, type Branch } from "../lib/branches-api";
import { GodownFormModal } from "../components/GodownFormModal";

export function Godowns() {
  const { accessToken } = useAuth();
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; godown: Godown } | null
  >(null);

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [godownData, branchData] = await Promise.all([
        listGodowns(accessToken),
        listBranches(accessToken),
      ]);
      setGodowns(godownData);
      setBranches(branchData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load godowns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (input: GodownInput) => {
    if (!accessToken) return;
    if (modalState?.mode === "edit") {
      await updateGodown(accessToken, modalState.godown.id, input);
    } else {
      await createGodown(accessToken, input);
    }
    setModalState(null);
    await load();
  };

  const handleDelete = async (godown: Godown) => {
    if (!accessToken) return;
    if (!confirm(`Delete godown "${godown.name}"?`)) return;
    try {
      await deleteGodown(accessToken, godown.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete godown");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Godowns</h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Add Godown
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {godowns.map((godown) => (
                <tr key={godown.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {godown.name}
                    {godown.isDefault && (
                      <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {godown.branch?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {godown.address || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModalState({ mode: "edit", godown })}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Edit"
                      >
                        <PencilEdit01Icon size={16} />
                      </button>
                      {!godown.isDefault && (
                        <button
                          onClick={() => handleDelete(godown)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {godowns.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No godowns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <GodownFormModal
          godown={modalState.mode === "edit" ? modalState.godown : null}
          branches={branches}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
