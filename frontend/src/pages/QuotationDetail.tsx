import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft01Icon, Delete02Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { canDeleteSales, hasRole } from "../lib/permissions";
import {
  convertQuotationToInvoice,
  deleteQuotation,
  getQuotation,
  updateQuotationStatus,
  type Quotation,
  type QuotationStatus,
} from "../lib/quotations-api";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  EXPIRED: "bg-amber-50 text-amber-700",
  CONVERTED: "bg-purple-50 text-purple-700",
};

const NEXT_STATUSES: Record<string, Exclude<QuotationStatus, "CONVERTED">[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};

export function QuotationDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const canDelete = hasRole(user?.role, canDeleteSales);
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const load = () => {
    if (!accessToken || !id) return;
    return getQuotation(accessToken, id)
      .then(setQuotation)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  };

  useEffect(() => {
    load()?.finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const handleStatusChange = async (status: Exclude<QuotationStatus, "CONVERTED">) => {
    if (!accessToken || !id) return;
    const updated = await updateQuotationStatus(accessToken, id, status);
    setQuotation(updated);
  };

  const handleConvert = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Convert this quotation into a sales invoice?")) return;
    setIsConverting(true);
    setError(null);
    try {
      const { invoice } = await convertQuotationToInvoice(accessToken, id);
      navigate(`/sales/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to convert");
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Delete this quotation?")) return;
    await deleteQuotation(accessToken, id);
    navigate("/quotations");
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error && !quotation) return <p className="text-sm text-red-600">{error}</p>;
  if (!quotation) return null;

  const nextStatuses = NEXT_STATUSES[quotation.status] ?? [];
  const canConvert = quotation.status !== "CONVERTED" && quotation.status !== "REJECTED" && quotation.status !== "EXPIRED";

  return (
    <div>
      <Link
        to="/quotations"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft01Icon size={16} />
        Back to Quotations
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {quotation.quotationNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {quotation.customer.name} ·{" "}
            {new Date(quotation.quotationDate).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/quotations/${id}/print`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PrinterIcon size={16} />
            Print
          </Link>
          {canDelete && quotation.status !== "CONVERTED" && (
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
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[quotation.status]}`}
        >
          {quotation.status}
        </span>
        {quotation.validUntil && (
          <span className="text-xs text-gray-500">
            Valid until {new Date(quotation.validUntil).toLocaleDateString("en-IN")}
          </span>
        )}
        {quotation.convertedInvoice && (
          <Link
            to={`/sales/${quotation.convertedInvoice.id}`}
            className="text-xs font-medium text-purple-600 hover:underline"
          >
            View invoice {quotation.convertedInvoice.invoiceNumber}
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
              {isConverting ? "Converting..." : "Convert to Invoice"}
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
            {quotation.items?.map((item) => (
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
            <span>₹{quotation.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{quotation.taxTotal}</span>
          </div>
          {Number(quotation.discountTotal) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-₹{quotation.discountTotal}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Grand Total</span>
            <span>₹{quotation.grandTotal}</span>
          </div>
        </div>
      </div>

      {quotation.notes && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-medium text-gray-700">Notes</h2>
          <p className="mt-1 text-sm text-gray-600">{quotation.notes}</p>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
