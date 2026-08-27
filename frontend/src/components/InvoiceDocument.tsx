import type { Business } from "../lib/business-api";

interface Party {
  name: string;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  address?: string | null;
}

interface InvoiceLineItem {
  id: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
  taxAmount: string;
  lineTotal: string;
}

interface InvoiceDocumentProps {
  business: Business;
  documentTitle: string;
  documentNumber: string;
  documentDate: string;
  partyLabel: string;
  party: Party;
  items: InvoiceLineItem[];
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  grandTotal: string;
  status: string;
}

export function InvoiceDocument({
  business,
  documentTitle,
  documentNumber,
  documentDate,
  partyLabel,
  party,
  items,
  subtotal,
  taxTotal,
  discountTotal,
  grandTotal,
  status,
}: InvoiceDocumentProps) {
  return (
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
            {documentTitle}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{documentNumber}</p>
          <p className="text-sm text-gray-600">
            {new Date(documentDate).toLocaleDateString("en-IN")}
          </p>
          <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {status}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-xs font-medium uppercase text-gray-500">
          {partyLabel}
        </p>
        <p className="mt-1 font-medium text-gray-900">{party.name}</p>
        {party.address && (
          <p className="text-sm text-gray-600">{party.address}</p>
        )}
        {party.phone && <p className="text-sm text-gray-600">{party.phone}</p>}
        {party.email && <p className="text-sm text-gray-600">{party.email}</p>}
        {party.gstin && (
          <p className="text-sm text-gray-600">GSTIN: {party.gstin}</p>
        )}
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-xs uppercase text-gray-500">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-right font-medium">GST</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-2">{item.productName}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">₹{item.unitPrice}</td>
              <td className="py-2 text-right">{item.gstRate}%</td>
              <td className="py-2 text-right font-medium">₹{item.lineTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-4 w-56 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>₹{taxTotal}</span>
        </div>
        {Number(discountTotal) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span>-₹{discountTotal}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-300 pt-1 text-base font-semibold text-gray-900">
          <span>Total</span>
          <span>₹{grandTotal}</span>
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-gray-400">
        This is a computer-generated document.
      </p>
    </div>
  );
}
