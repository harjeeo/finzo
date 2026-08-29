import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft01Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { getDeliveryChallan, type DeliveryChallan } from "../lib/delivery-challans-api";
import { getBusiness, type Business } from "../lib/business-api";

export function DeliveryChallanPrint() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [dc, setDc] = useState<DeliveryChallan | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    Promise.all([getDeliveryChallan(accessToken, id), getBusiness(accessToken)])
      .then(([dcData, businessData]) => {
        setDc(dcData);
        setBusiness(businessData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, id]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!dc || !business) {
    return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between print:hidden">
        <Link
          to={`/delivery-challans/${id}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft01Icon size={16} />
          Back
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <PrinterIcon size={16} />
          Print
        </button>
      </div>

      <div className="mx-auto max-w-3xl bg-white p-10 text-gray-900 print:p-0">
        <div className="flex items-start justify-between border-b border-gray-300 pb-6">
          <div>
            <h1 className="text-xl font-bold">{business.name}</h1>
            {business.address && (
              <p className="mt-1 text-sm text-gray-600">{business.address}</p>
            )}
            {(business.city || business.state || business.pincode) && (
              <p className="text-sm text-gray-600">
                {[business.city, business.state, business.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {business.gstin && (
              <p className="mt-1 text-sm text-gray-600">GSTIN: {business.gstin}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold uppercase text-gray-700">
              Delivery Challan
            </h2>
            <p className="mt-1 text-xs font-medium uppercase text-red-500">
              Not a Tax Invoice
            </p>
            <p className="mt-1 text-sm text-gray-600">{dc.challanNumber}</p>
            <p className="text-sm text-gray-600">
              {new Date(dc.challanDate).toLocaleDateString("en-IN")}
            </p>
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {dc.status}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-between">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">
              Deliver To
            </p>
            <p className="mt-1 font-medium text-gray-900">{dc.customer.name}</p>
            {dc.customer.address && (
              <p className="text-sm text-gray-600">{dc.customer.address}</p>
            )}
            {dc.customer.phone && (
              <p className="text-sm text-gray-600">{dc.customer.phone}</p>
            )}
            {dc.customer.gstin && (
              <p className="text-sm text-gray-600">GSTIN: {dc.customer.gstin}</p>
            )}
          </div>
          {(dc.vehicleNumber || dc.transporterName) && (
            <div className="text-right">
              {dc.vehicleNumber && (
                <p className="text-sm text-gray-600">
                  Vehicle No: {dc.vehicleNumber}
                </p>
              )}
              {dc.transporterName && (
                <p className="text-sm text-gray-600">
                  Transporter: {dc.transporterName}
                </p>
              )}
            </div>
          )}
        </div>

        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
              <th className="py-2 font-medium">Item</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-right font-medium">Rate</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {dc.items?.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2">{item.productName}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">₹{item.unitPrice}</td>
                <td className="py-2 text-right font-medium">₹{item.lineTotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-12 text-center text-xs text-gray-400">
          This is a computer-generated document. Goods dispatched for delivery purposes only.
        </p>
      </div>
    </div>
  );
}
