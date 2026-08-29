import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft01Icon, Delete02Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { canDeleteSales, hasRole } from "../lib/permissions";
import {
  convertPurchaseOrderToBill,
  deletePurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrderStatus,
  type PurchaseOrder,
  type PurchaseOrderStatus,
} from "../lib/purchase-orders-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  CONFIRMED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
  CONVERTED: "bg-purple-50 text-purple-700",
};

const NEXT_STATUSES: Record<string, Exclude<PurchaseOrderStatus, "CONVERTED">[]> = {
  DRAFT: ["SENT"],
  SENT: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: [],
  CANCELLED: [],
};

export function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const canDelete = hasRole(user?.role, canDeleteSales);
  const navigate = useNavigate();

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const load = () => {
    if (!accessToken || !id) return;
    return getPurchaseOrder(accessToken, id)
      .then(setPo)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  };

  useEffect(() => {
    load()?.finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const handleStatusChange = async (status: Exclude<PurchaseOrderStatus, "CONVERTED">) => {
    if (!accessToken || !id) return;
    const updated = await updatePurchaseOrderStatus(accessToken, id, status);
    setPo(updated);
  };

  const handleConvert = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Convert this purchase order into a purchase bill?")) return;
    setIsConverting(true);
    setError(null);
    try {
      const { bill } = await convertPurchaseOrderToBill(accessToken, id);
      navigate(`/purchase/${bill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert");
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Delete this purchase order?")) return;
    await deletePurchaseOrder(accessToken, id);
    navigate("/purchase-orders");
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error && !po) return <p className="text-sm text-red-600">{error}</p>;
  if (!po) return null;

  const nextStatuses = NEXT_STATUSES[po.status] ?? [];
  const canConvert = po.status !== "CONVERTED" && po.status !== "CANCELLED";

  return (
    <div>
      <Link
        to="/purchase-orders"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft01Icon size={16} />
        Back to Purchase Orders
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{po.poNumber}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {po.supplier.name} · {new Date(po.poDate).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/purchase-orders/${id}/print`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PrinterIcon size={16} />
            Print
          </Link>
          {canDelete && po.status !== "CONVERTED" && (
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
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[po.status]}`}
        >
          {po.status}
        </span>
        {po.expectedDate && (
          <span className="text-xs text-gray-500">
            Expected {new Date(po.expectedDate).toLocaleDateString("en-IN")}
          </span>
        )}
        {po.convertedBill && (
          <Link
            to={`/purchase/${po.convertedBill.id}`}
            className="text-xs font-medium text-purple-600 hover:underline"
          >
            View bill {po.convertedBill.billNumber}
          </Link>
        )}
      </div>

      {(nextStatuses.length > 0 || canConvert) && (
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
          {canConvert && (
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isConverting ? "Converting..." : "Convert to Purchase Bill"}
            </button>
          )}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Qty</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">GST</th>
              <th className="px-4 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {po.items?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                <td className="px-4 py-3 text-gray-600">₹{item.unitPrice}</td>
                <td className="px-4 py-3 text-gray-600">{item.gstRate}%</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  ₹{item.lineTotal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-gray-200 p-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{po.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{po.taxTotal}</span>
          </div>
          {Number(po.discountTotal) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-₹{po.discountTotal}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Grand Total</span>
            <span>₹{po.grandTotal}</span>
          </div>
        </div>
      </div>

      {po.notes && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-700">Notes</h2>
          <p className="mt-1 text-sm text-gray-600">{po.notes}</p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
