import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft01Icon, Delete02Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { canDeleteSales, hasRole } from "../lib/permissions";
import {
  deleteDeliveryChallan,
  getDeliveryChallan,
  updateDeliveryChallanStatus,
  type DeliveryChallan,
  type DeliveryChallanStatus,
} from "../lib/delivery-challans-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  DISPATCHED: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const NEXT_STATUSES: Record<string, DeliveryChallanStatus[]> = {
  DRAFT: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function DeliveryChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const canDelete = hasRole(user?.role, canDeleteSales);
  const navigate = useNavigate();

  const [dc, setDc] = useState<DeliveryChallan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!accessToken || !id) return;
    return getDeliveryChallan(accessToken, id)
      .then(setDc)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  };

  useEffect(() => {
    load()?.finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const handleStatusChange = async (status: DeliveryChallanStatus) => {
    if (!accessToken || !id) return;
    const updated = await updateDeliveryChallanStatus(accessToken, id, status);
    setDc(updated);
  };

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Delete this delivery challan?")) return;
    await deleteDeliveryChallan(accessToken, id);
    navigate("/delivery-challans");
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error && !dc) return <p className="text-sm text-red-600">{error}</p>;
  if (!dc) return null;

  const nextStatuses = NEXT_STATUSES[dc.status] ?? [];

  return (
    <div>
      <Link
        to="/delivery-challans"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft01Icon size={16} />
        Back to Delivery Challans
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{dc.challanNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {dc.customer.name} · {new Date(dc.challanDate).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/delivery-challans/${id}/print`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PrinterIcon size={16} />
            Print
          </Link>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Delete02Icon size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[dc.status]}`}
        >
          {dc.status}
        </span>
        {dc.vehicleNumber && (
          <span className="text-xs text-gray-500">Vehicle: {dc.vehicleNumber}</span>
        )}
        {dc.transporterName && (
          <span className="text-xs text-gray-500">
            Transporter: {dc.transporterName}
          </span>
        )}
        {dc.salesInvoice && (
          <Link
            to={`/sales/${dc.salesInvoice.id}`}
            className="text-xs font-medium text-purple-600 hover:underline"
          >
            View invoice {dc.salesInvoice.invoiceNumber}
          </Link>
        )}
      </div>

      {nextStatuses.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {nextStatuses.map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Mark as {status}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dc.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-600">₹{item.unitPrice}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  ₹{item.lineTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dc.notes && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-700">Notes</h2>
          <p className="mt-1 text-sm text-gray-600">{dc.notes}</p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
