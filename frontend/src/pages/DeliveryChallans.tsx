import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Add01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  listDeliveryChallans,
  type DeliveryChallan,
} from "../lib/delivery-challans-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  DISPATCHED: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export function DeliveryChallans() {
  const { accessToken } = useAuth();
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    listDeliveryChallans(accessToken)
      .then(setChallans)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Delivery Challans</h1>
        <Link
          to="/delivery-challans/new"
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          New Delivery Challan
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : challans.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No delivery challans yet. Create your first one to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Challan #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {challans.map((dc) => (
                <tr key={dc.id}>
                  <td className="px-4 py-3">
                    <Link
                      to={`/delivery-challans/${dc.id}`}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      {dc.challanNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{dc.customer.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(dc.challanDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {dc.vehicleNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[dc.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {dc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
