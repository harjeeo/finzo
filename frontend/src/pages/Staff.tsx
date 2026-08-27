import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createStaff,
  listStaff,
  removeStaff,
  updateStaffRole,
  type StaffMember,
} from "../lib/staff-api";
import { AddStaffModal } from "../components/AddStaffModal";

const roles = ["MANAGER", "ACCOUNTANT", "CASHIER", "STAFF"];

export function Staff() {
  const { accessToken, user } = useAuth();
  const isOwner = user?.role === "OWNER";
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadStaff = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listStaff(accessToken);
      setMembers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleAdd = async (input: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => {
    if (!accessToken) return;
    await createStaff(accessToken, input);
    setShowAddModal(false);
    await loadStaff();
  };

  const handleRoleChange = async (member: StaffMember, role: string) => {
    if (!accessToken) return;
    await updateStaffRole(accessToken, member.id, role);
    await loadStaff();
  };

  const handleRemove = async (member: StaffMember) => {
    if (!accessToken) return;
    if (!confirm(`Remove ${member.user.name} from this business?`)) return;
    await removeStaff(accessToken, member.id);
    await loadStaff();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Staff</h1>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Add01Icon size={18} />
            Add Staff
          </button>
        )}
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
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => {
                const isSelf = member.user.id === user?.sub;
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {member.user.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-gray-400">(you)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {member.user.email}
                    </td>
                    <td className="px-4 py-3">
                      {member.role === "OWNER" ? (
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          OWNER
                        </span>
                      ) : isOwner ? (
                        <select
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member, e.target.value)
                          }
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-gray-600">
                          {member.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isOwner && member.role !== "OWNER" && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleRemove(member)}
                            className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            aria-label="Remove"
                          >
                            <Delete02Icon size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAdd}
        />
      )}
    </div>
  );
}
