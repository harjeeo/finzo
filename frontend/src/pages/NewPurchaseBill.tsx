import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listSuppliers, type Supplier } from "../lib/suppliers-api";
import { listProducts, type Product } from "../lib/products-api";
import { createPurchaseBill } from "../lib/purchases-api";
import { listBranches, type Branch } from "../lib/branches-api";
import { listGodowns, type Godown } from "../lib/godowns-api";

interface LineItem {
  productId: string;
  quantity: string;
  unitPrice: string;
  batchNumber: string;
  expiryDate: string;
}

export function NewPurchaseBill() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [godownId, setGodownId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { productId: "", quantity: "1", unitPrice: "", batchNumber: "", expiryDate: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listSuppliers(accessToken).then(setSuppliers);
    listProducts(accessToken).then(setProducts);
    listBranches(accessToken).then((data) => {
      setBranches(data);
      const defaultBranch = data.find((b) => b.isDefault) ?? data[0];
      if (defaultBranch) setBranchId(defaultBranch.id);
    });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken || !branchId) return;
    listGodowns(accessToken, branchId).then((data) => {
      setGodowns(data);
      const defaultGodown = data.find((g) => g.isDefault) ?? data[0];
      setGodownId(defaultGodown ? defaultGodown.id : "");
    });
  }, [accessToken, branchId]);

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
      unitPrice: product ? product.purchasePrice : "",
    });
  };

  const addLine = () => {
    setLineItems((prev) => [
      ...prev,
      { productId: "", quantity: "1", unitPrice: "", batchNumber: "", expiryDate: "" },
    ]);
  };

  const removeLine = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const computeLineTotal = (line: LineItem) => {
    const product = productMap.get(line.productId);
    if (!product) return 0;
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    const subtotal = qty * price;
    const tax = subtotal * (Number(product.gstRate) / 100);
    return subtotal + tax;
  };

  const subtotal = lineItems.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const taxTotal = lineItems.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    if (!product) return sum;
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    return sum + qty * price * (Number(product.gstRate) / 100);
  }, 0);

  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async () => {
    if (!accessToken) return;
    setError(null);

    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }
    const validLines = lineItems.filter(
      (line) => line.productId && Number(line.quantity) > 0,
    );
    if (validLines.length === 0) {
      setError("Add at least one product line");
      return;
    }
    const missingBatch = validLines.find((line) => {
      const product = productMap.get(line.productId);
      return product?.tracksBatches && !line.batchNumber;
    });
    if (missingBatch) {
      setError(
        `"${productMap.get(missingBatch.productId)?.name}" tracks batches — enter a batch number`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const bill = await createPurchaseBill(accessToken, {
        supplierId,
        branchId: branchId || undefined,
        godownId: godownId || undefined,
        items: validLines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity),
          unitPrice: line.unitPrice ? Number(line.unitPrice) : undefined,
          batchNumber: line.batchNumber || undefined,
          expiryDate: line.expiryDate || undefined,
        })),
      });
      navigate(`/purchase/${bill.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create bill");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        New Purchase Bill
      </h1>

      <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Supplier *
          </label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">Select a supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {(branches.length > 1 || godowns.length > 1) && (
          <div className="mt-4 grid grid-cols-2 gap-3">
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
            {godowns.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Godown
                </label>
                <select
                  value={godownId}
                  onChange={(e) => setGodownId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {godowns.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                      {g.isDefault ? " (Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

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
            {lineItems.map((line, index) => {
              const product = productMap.get(line.productId);
              return (
                <div key={index} className="rounded-lg border border-gray-100 p-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={line.productId}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (stock: {p.currentStock})
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
                    <span className="w-24 text-right text-sm font-medium text-gray-900">
                      ₹{computeLineTotal(line).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeLine(index)}
                      disabled={lineItems.length === 1}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                      aria-label="Remove line"
                    >
                      <Delete02Icon size={16} />
                    </button>
                  </div>
                  {product?.tracksBatches && (
                    <div className="mt-2 flex items-center gap-2 pl-1">
                      <input
                        value={line.batchNumber}
                        onChange={(e) =>
                          updateLine(index, { batchNumber: e.target.value })
                        }
                        placeholder="Batch number *"
                        className="w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={(e) =>
                          updateLine(index, { expiryDate: e.target.value })
                        }
                        title="Expiry date"
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-1 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => navigate("/purchase")}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Bill"}
          </button>
        </div>
      </div>
    </div>
  );
}
