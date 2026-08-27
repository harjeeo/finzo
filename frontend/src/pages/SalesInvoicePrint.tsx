import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft01Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { getSalesInvoice, type SalesInvoice } from "../lib/sales-api";
import { getBusiness, type Business } from "../lib/business-api";
import { InvoiceDocument } from "../components/InvoiceDocument";

export function SalesInvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [invoice, setInvoice] = useState<SalesInvoice | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    Promise.all([getSalesInvoice(accessToken, id), getBusiness(accessToken)])
      .then(([invoiceData, businessData]) => {
        setInvoice(invoiceData);
        setBusiness(businessData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, id]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!invoice || !business) {
    return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between print:hidden">
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

      <InvoiceDocument
        business={business}
        documentTitle="Tax Invoice"
        documentNumber={invoice.invoiceNumber}
        documentDate={invoice.invoiceDate}
        partyLabel="Bill To"
        party={invoice.customer}
        items={invoice.items ?? []}
        subtotal={invoice.subtotal}
        taxTotal={invoice.taxTotal}
        discountTotal={invoice.discountTotal}
        grandTotal={invoice.grandTotal}
        status={invoice.status}
      />
    </div>
  );
}
