import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listCustomers, type Customer } from "../lib/customers-api";
import { listProducts, type Product } from "../lib/products-api";
import { createDeliveryChallan } from "../lib/delivery-challans-api";
import { listBranches, type Branch } from "../lib/branches-api";
import { listSalesInvoices, getSalesInvoice, type SalesInvoice } from "../lib/sales-api";

interface LineItem {
  productId: string;
  quantity: string;
  unitPrice: string;
}

export function NewDeliveryChallan() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [salesInvoiceId, setSalesInvoiceId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productId: "", quantity: "1", unitPrice: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listCustomers(accessToken).then(setCustomers);
    listProducts(accessToken).then(setProducts);
    listSalesInvoices(accessToken).then(setInvoices);
    listBranches(accessToken).then((data) => {
      setBranches(data);
      const defaultBranch = data.find((b) => b.isDefault) ?? data[0];
      if (defaultBranch) setBranchId(defaultBranch.id);
    });
  }, [accessToken]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = productMap.get(productId);
    updateLine(index, {
      productId,
      unitPrice: product ? product.sellingPrice : "",
    });
  };

  const addLine = () => {
    setLineItems((prev) => [
      ...prev,
      { productId: "", quantity: "1", unitPrice: "" },
    ]);
  };

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLoadInvoice = async (invoiceId: string) => {
    setSalesInvoiceId(invoiceId);
    if (!accessToken || !invoiceId) return;
    const invoice = await getSalesInvoice(accessToken, invoiceId);
    setCustomerId(invoice.customer.id);
    if (invoice.items && invoice.items.length > 0) {
      setLineItems(
        invoice.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      );
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) return;
    setError(null);

    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    const validLines = lineItems.filter(
      (line) => line.productId && Number(line.quantity) > 0,
    );
    if (validLines.length === 0) {
      setError("Add at least one product line");
      return;
    }

    setIsSubmitting(true);
    try {
      const dc = await createDeliveryChallan(accessToken, {
        customerId,
        branchId: branchId || undefined,
        salesInvoiceId: salesInvoiceId || undefined,
        vehicleNumber: vehicleNumber || undefined,
        transporterName: transporterName || undefined,
        notes: notes || undefined,
        items: validLines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPrice: line.unitPrice ? Number(line.unitPrice) : undefined,
        })),
      });
      navigate(`/delivery-challans/${dc.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create delivery challan");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">New Delivery Challan</h1>

      <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Load from Sales Invoice (optional)
          </label>
          <select
            value={salesInvoiceId}
            onChange={(e) => handleLoadInvoice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">None</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} · {inv.customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicle Number
            </label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Transporter Name
            </label>
            <input
              type="text"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {branches.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Branch
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.isDefault ? " (Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Items</h2>
            <button
              onClick={addLine}
              className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:underline"
            >
              <Add01Icon size={16} />
              Add line
            </button>
          </div>

          <div className="space-y-2">
            {lineItems.map((line, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={line.productId}
                  onChange={(e) => handleProductChange(index, e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(index, { quantity: e.target.value })
                  }
                  placeholder="Qty"
                  className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) =>
                    updateLine(index, { unitPrice: e.target.value })
                  }
                  placeholder="Rate"
                  className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                  onClick={() => removeLine(index)}
                  disabled={lineItems.length === 1}
                  className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  aria-label="Remove line"
                >
                  <Delete02Icon size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => navigate("/delivery-challans")}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Delivery Challan"}
          </button>
        </div>
      </div>
    </div>
  );
}
