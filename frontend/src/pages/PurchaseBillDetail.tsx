import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft01Icon, Delete02Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  addPurchasePayment,
  deletePurchaseBill,
  getPurchaseBill,
  type PurchaseBill,
} from "../lib/purchases-api";
import { RecordPaymentModal } from "../components/RecordPaymentModal";

export function PurchaseBillDetail() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [bill, setBill] = useState<PurchaseBill | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!accessToken || !id) return;
    getPurchaseBill(accessToken, id)
      .then(setBill)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);

  const handleDelete = async () => {
    if (!accessToken || !id) return;
    if (!confirm("Delete this bill? Stock added by it will be reversed.")) return;
    await deletePurchaseBill(accessToken, id);
    navigate("/purchase");
  };

  const handleRecordPayment = async (input: {
    amount: number;
    paymentMode: string;
    reference?: string;
  }) => {
    if (!accessToken || !id) return;
    const updated = await addPurchasePayment(accessToken, id, input);
    setBill(updated);
    setShowPaymentModal(false);
  };

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!bill) return null;

  const balanceDue = Number(bill.grandTotal) - Number(bill.amountPaid);
  const canRecordPayment = balanceDue > 0 && bill.status !== "CANCELLED";

  return (
    <div>
      <Link
        to="/purchase"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft01Icon size={16} />
        Back to Purchase
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {bill.billNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {bill.supplier.name} ·{" "}
            {new Date(bill.billDate).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/purchase/${id}/print`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <PrinterIcon size={16} />
            Print
          </Link>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Delete02Icon size={16} />
            Delete
          </button>
        </div>
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
            {bill.items?.map((item) => (
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
            <span>₹{bill.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{bill.taxTotal}</span>
          </div>
          {Number(bill.discountTotal) > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount</span>
              <span>-₹{bill.discountTotal}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Grand Total</span>
            <span>₹{bill.grandTotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Amount Paid</span>
            <span>₹{bill.amountPaid}</span>
          </div>
          <div className="flex justify-between font-medium text-gray-900">
            <span>Balance Due</span>
            <span>₹{balanceDue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white">
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
        {!bill.payments || bill.payments.length === 0 ? (
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
              {bill.payments.map((payment) => (
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

      {showPaymentModal && (
        <RecordPaymentModal
          balanceDue={balanceDue}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={handleRecordPayment}
        />
      )}
    </div>
  );
}
