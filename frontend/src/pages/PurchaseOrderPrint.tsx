import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft01Icon, PrinterIcon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { getPurchaseOrder, type PurchaseOrder } from "../lib/purchase-orders-api";
import { getBusiness, type Business } from "../lib/business-api";
import { InvoiceDocument } from "../components/InvoiceDocument";

export function PurchaseOrderPrint() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();

  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    Promise.all([getPurchaseOrder(accessToken, id), getBusiness(accessToken)])
      .then(([poData, businessData]) => {
        setPo(poData);
        setBusiness(businessData);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, id]);

  if (error) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!po || !business) {
    return <p className="p-6 text-sm text-gray-500">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between print:hidden">
        <Link
          to={`/purchase-orders/${id}`}
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
        documentTitle="Purchase Order"
        documentNumber={po.poNumber}
        documentDate={po.poDate}
        partyLabel="Supplier"
        party={po.supplier}
        items={po.items ?? []}
        subtotal={po.subtotal}
        taxTotal={po.taxTotal}
        discountTotal={po.discountTotal}
        grandTotal={po.grandTotal}
        status={po.status}
      />
    </div>
  );
}
