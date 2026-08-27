import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createBranch,
  deleteBranch,
  listBranches,
  updateBranch,
  type Branch,
  type BranchInput,
} from "../lib/branches-api";
import { BranchFormModal } from "../components/BranchFormModal";

export function Branches() {
  const { accessToken } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; branch: Branch } | null
  >(null);

  const loadBranches = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listBranches(accessToken);
      setBranches(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load branches");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (input: BranchInput) => {
    if (!accessToken) return;
    if (modalState?.mode === "edit") {
      await updateBranch(accessToken, modalState.branch.id, input);
    } else {
      await createBranch(accessToken, input);
    }
    setModalState(null);
    await loadBranches();
  };

  const handleDelete = async (branch: Branch) => {
    if (!accessToken) return;
    if (!confirm(`Delete branch "${branch.name}"?`)) return;
    await deleteBranch(accessToken, branch.id);
    await loadBranches();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Branches</h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Add Branch
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
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branches.map((branch) => (
                <tr key={branch.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {branch.name}
                    {branch.isDefault && (
                      <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                        Default
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {branch.address || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setModalState({ mode: "edit", branch })}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Edit"
                      >
                        <PencilEdit01Icon size={16} />
                      </button>
                      {!branch.isDefault && (
                        <button
                          onClick={() => handleDelete(branch)}
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
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <BranchFormModal
          branch={modalState.mode === "edit" ? modalState.branch : null}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
