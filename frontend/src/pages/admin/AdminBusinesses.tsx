import { useEffect, useState } from "react";
import { Cancel01Icon } from "hugeicons-react";
import { useAuth } from "../../lib/auth-context";
import {
  getBusinessDetail,
  listAllBusinesses,
  updateBusinessStatus,
  type AdminBusinessDetail,
  type AdminBusinessListItem,
} from "../../lib/super-admin-api";

export function AdminBusinesses() {
  const { accessToken } = useAuth();
  const [businesses, setBusinesses] = useState<AdminBusinessListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AdminBusinessDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadBusinesses = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      setBusinesses(await listAllBusinesses(accessToken));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const openDetail = async (id: string) => {
    if (!accessToken) return;
    setIsDetailLoading(true);
    try {
      setSelected(await getBusinessDetail(accessToken, id));
    } finally {
      setIsDetailLoading(false);
    }
  };

  const toggleStatus = async () => {
    if (!accessToken || !selected) return;
    const nextStatus = selected.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (
      !confirm(
        nextStatus === "SUSPENDED"
          ? `Suspend "${selected.name}"? Its users will not be able to log in.`
          : `Reactivate "${selected.name}"?`,
      )
    ) {
      return;
    }
    setIsUpdating(true);
    try {
      const updated = await updateBusinessStatus(accessToken, selected.id, nextStatus);
      setSelected({ ...selected, status: updated.status });
      await loadBusinesses();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Businesses</h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Invoices</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {businesses.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => openDetail(b.id)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {b.name}
                    {b.city && (
                      <span className="ml-2 text-xs text-gray-400">
                        {b.city}
                        {b.state ? `, ${b.state}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.owner ? (
                      <>
                        <div>{b.owner.name}</div>
                        <div className="text-xs text-gray-400">{b.owner.email}</div>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.memberCount}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {b.salesInvoiceCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "ACTIVE"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No businesses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {(selected || isDetailLoading) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {isDetailLoading || !selected ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selected.name}
                    </h2>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        selected.status === "ACTIVE"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {selected.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <Cancel01Icon size={20} />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Total Sales</p>
                    <p className="font-semibold text-gray-900">
                      ₹{selected.stats.totalSales.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selected.stats.salesInvoiceCount} invoices
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Total Purchases</p>
                    <p className="font-semibold text-gray-900">
                      ₹{selected.stats.totalPurchases.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selected.stats.purchaseBillCount} bills
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Customers</p>
                    <p className="font-semibold text-gray-900">
                      {selected.stats.customerCount}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-gray-500">Products</p>
                    <p className="font-semibold text-gray-900">
                      {selected.stats.productCount}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Members ({selected.members.length})
                  </h3>
                  <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {selected.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {m.user.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {m.user.email}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{m.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={toggleStatus}
                    disabled={isUpdating}
                    className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${
                      selected.status === "ACTIVE"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {isUpdating
                      ? "Saving..."
                      : selected.status === "ACTIVE"
                        ? "Suspend Business"
                        : "Reactivate Business"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
