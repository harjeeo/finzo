import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { canDeleteSales, hasRole } from "../lib/permissions";
import {
  deleteSalesInvoice,
  getSalesInvoice,
  type SalesInvoice,
} from "../lib/sales-api";

export function SalesInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const canDelete = hasRole(user?.role, canDeleteSales);
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    getSalesInvoice(accessToken, id)
      .then(setInvoice)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Delete this invoice? Stock will be restored.")) return;
    await deleteSalesInvoice(accessToken, id);
    navigate("/sales");
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice) return null;

  return (
    <div>
      <Link
        to="/sales"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft01Icon size={16} />
        Back to Sales
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {invoice.customer.name} ·{" "}
            {new Date(invoice.invoiceDate).toLocaleDateString("en-IN")}
          </p>
        </div>
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

      <div className="mt-6 max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white">
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
            {invoice.items?.map((item) => (
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
            <span>₹{invoice.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{invoice.taxTotal}</span>
          </div>
          {Number(invoice.discountTotal) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-₹{invoice.discountTotal}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Grand Total</span>
            <span>₹{invoice.grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
