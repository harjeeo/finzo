import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft01Icon,
  Delete02Icon,
  PrinterIcon,
  ReturnRequestIcon,
} from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { canDeleteSales, hasRole } from "../lib/permissions";
import {
  addSalesPayment,
  createSalesReturn,
  deleteSalesInvoice,
  getSalesInvoice,
  type SalesInvoice,
} from "../lib/sales-api";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { CreateReturnModal } from "../components/CreateReturnModal";

export function SalesInvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, user } = useAuth();
  const canDelete = hasRole(user?.role, canDeleteSales);
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const loadInvoice = () => {
    if (!accessToken || !id) return;
    return getSalesInvoice(accessToken, id)
      .then(setInvoice)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  };

  useEffect(() => {
    loadInvoice()?.finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, id]);

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Delete this invoice? Stock will be restored.")) return;
    await deleteSalesInvoice(accessToken, id);
    navigate("/sales");
  };

  const handleRecordPayment = async (input: {
    amount: number;
    paymentMode: string;
    reference?: string;
  }) => {
    if (!accessToken || !id) return;
    const updated = await addSalesPayment(accessToken, id, input);
    setInvoice(updated);
    setShowPaymentModal(false);
  };

  const handleCreateReturn = async (
    items: { productId: string; quantity: number }[],
  ) => {
    if (!accessToken || !id) return;
    await createSalesReturn(accessToken, id, { items });
    setShowReturnModal(false);
    await loadInvoice();
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!invoice) return null;

  const balanceDue = Number(invoice.grandTotal) - Number(invoice.amountPaid);
  const canRecordPayment = balanceDue > 0 && invoice.status !== "CANCELLED";

  const returnedByProduct = new Map<string, number>();
  for (const ret of invoice.returns ?? []) {
    for (const item of ret.items) {
      returnedByProduct.set(
        item.productId,
        (returnedByProduct.get(item.productId) ?? 0) + Number(item.quantity),
      );
    }
  }
  const returnableItems = (invoice.items ?? [])
    .map((item) => ({
      productId: item.productId,
      productName: item.productName,
      maxReturnable:
        Number(item.quantity) - (returnedByProduct.get(item.productId) ?? 0),
    }))
    .filter((item) => item.maxReturnable > 0);
  const canReturn = invoice.status !== "CANCELLED" && returnableItems.length > 0;

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
        <div className="flex items-center gap-2">
          <Link
            to={`/sales/${id}/print`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PrinterIcon size={16} />
            Print
          </Link>
          {canDelete && canReturn && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ReturnRequestIcon size={16} />
              Return Items
            </button>
          )}
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
          <div className="flex justify-between text-gray-600">
            <span>Amount Paid</span>
            <span>₹{invoice.amountPaid}</span>
          </div>
          <div className="flex justify-between font-medium text-gray-900">
            <span>Balance Due</span>
            <span>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-700">Payment History</h2>
          {canRecordPayment && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
            >
              Record Payment
            </button>
          )}
        </div>
        {!invoice.payments || invoice.payments.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No payments recorded yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Mode</th>
                <th className="px-4 py-2 font-medium">Reference</th>
                <th className="px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(payment.paymentDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {payment.paymentMode}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {payment.reference || "-"}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    ₹{payment.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {invoice.returns && invoice.returns.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-medium text-gray-700">
              Credit Notes (Returns)
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Credit Note #</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Items</th>
                <th className="px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.returns.map((ret) => (
                <tr key={ret.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {ret.returnNumber}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {new Date(ret.returnDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {ret.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    ₹{ret.grandTotal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPaymentModal && (
        <RecordPaymentModal
          balanceDue={balanceDue}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleRecordPayment}
        />
      )}

      {showReturnModal && (
        <CreateReturnModal
          title="Return Items"
          items={returnableItems}
          onClose={() => setShowReturnModal(false)}
          onSubmit={handleCreateReturn}
        />
      )}
    </div>
  );
}
