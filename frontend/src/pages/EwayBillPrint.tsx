import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft01Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { getSalesInvoice, type SalesInvoice } from "../lib/sales-api";
import { getBusiness, type Business } from "../lib/business-api";
import { getEwayBill, type EwayBill } from "../lib/eway-bill-api";

export function EwayBillPrint() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [ewayBill, setEwayBill] = useState<EwayBill | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    Promise.all([
      getSalesInvoice(accessToken, id),
      getBusiness(accessToken),
      getEwayBill(accessToken, id),
    ])
      .then(([invoiceData, businessData, ewayBillData]) => {
        setInvoice(invoiceData);
        setBusiness(businessData);
        setEwayBill(ewayBillData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, id]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!invoice || !business) {
    return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  }
  if (!ewayBill) {
    return (
      <p className="p-6 text-sm text-gray-500">
        No E-Way Bill has been generated for this invoice yet.
      </p>
    );
  }

  const row = (label: string, value: string) => (
    <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value || "-"}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between print:hidden">
        <Link
          to={`/sales/${id}`}
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

      <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 print:rounded-none print:border-0">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">E-Way Bill</h1>
          <p className="text-sm text-gray-500">
            {ewayBill.status === "CANCELLED" ? "CANCELLED" : "Delivery Challan / Transport Document"}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Part A — Consignment Details
          </h2>
          {row("EWB Number", ewayBill.ewbNumber ?? "Pending (not yet generated on GST portal)")}
          {row("Invoice Number", invoice.invoiceNumber)}
          {row("Invoice Date", new Date(invoice.invoiceDate).toLocaleDateString("en-IN"))}
          {row("Supplier (From)", `${business.name}${business.gstin ? ` (GSTIN: ${business.gstin})` : ""}`)}
          {row("Recipient (To)", `${invoice.customer.name}${invoice.customer.gstin ? ` (GSTIN: ${invoice.customer.gstin})` : ""}`)}
          {row("Recipient Address", invoice.customer.address ?? "-")}
          {row("Taxable Value", `₹${invoice.subtotal}`)}
          {row("Tax Amount", `₹${invoice.taxTotal}`)}
          {row("Total Invoice Value", `₹${invoice.grandTotal}`)}
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700">
            Part B — Transport Details
          </h2>
          {row("Transport Mode", ewayBill.transportMode)}
          {row("Vehicle Number", ewayBill.vehicleNumber ?? "-")}
          {row("Transporter Name", ewayBill.transporterName ?? "-")}
          {row("Transporter GSTIN/ID", ewayBill.transporterId ?? "-")}
          {row("Approx. Distance", `${ewayBill.distanceKm} km`)}
          {row("Valid Until", new Date(ewayBill.validUntil).toLocaleDateString("en-IN"))}
          {row("Status", ewayBill.status)}
        </div>
      </div>
    </div>
  );
}
