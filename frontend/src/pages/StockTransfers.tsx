import { useEffect, useState } from "react";
import { Add01Icon, Cancel01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listProducts, type Product } from "../lib/products-api";
import { listGodowns, type Godown } from "../lib/godowns-api";
import {
  createStockTransfer,
  getProductStock,
  listStockTransfers,
  type ProductStockEntry,
  type StockTransfer,
} from "../lib/inventory-api";

export function StockTransfers() {
  const { accessToken } = useAuth();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [transferData, productData, godownData] = await Promise.all([
        listStockTransfers(accessToken),
        listProducts(accessToken),
        listGodowns(accessToken),
      ]);
      setTransfers(transferData);
      setProducts(productData);
      setGodowns(godownData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Stock Transfers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          New Transfer
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : transfers.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No stock transfers yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Batch</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(t.transferDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {t.product.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.batch?.batchNumber ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.fromGodown.name}</td>
                  <td className="px-4 py-3 text-gray-600">{t.toGodown.name}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {t.quantity} {t.product.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <NewTransferModal
          products={products}
          godowns={godowns}
          onClose={() => setShowModal(false)}
          onCreated={async () => {
            setShowModal(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function NewTransferModal({
  products,
  godowns,
  onClose,
  onCreated,
}: {
  products: Product[];
  godowns: Godown[];
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { accessToken } = useAuth();
  const [productId, setProductId] = useState("");
  const [fromGodownId, setFromGodownId] = useState("");
  const [toGodownId, setToGodownId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [availableStock, setAvailableStock] = useState<ProductStockEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  useEffect(() => {
    if (!accessToken || !productId) {
      setAvailableStock([]);
      return;
    }
    getProductStock(accessToken, productId).then(setAvailableStock);
  }, [accessToken, productId]);

  const batchOptions = availableStock.filter(
    (s) => s.godownId === fromGodownId && s.batchId,
  );

  const handleSubmit = async () => {
    if (!accessToken) return;
    setError(null);
    if (!productId || !fromGodownId || !toGodownId || !quantity) {
      setError("Fill all required fields");
      return;
    }
    if (selectedProduct?.tracksBatches && !batchId) {
      setError("Select a batch to transfer");
      return;
    }
    setIsSubmitting(true);
    try {
      await createStockTransfer(accessToken, {
        productId,
        fromGodownId,
        toGodownId,
        batchId: batchId || undefined,
        quantity: Number(quantity),
        notes: notes || undefined,
      });
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            New Stock Transfer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Product *
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setBatchId("");
              }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                From Godown *
              </label>
              <select
                value={fromGodownId}
                onChange={(e) => {
                  setFromGodownId(e.target.value);
                  setBatchId("");
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select godown</option>
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                To Godown *
              </label>
              <select
                value={toGodownId}
                onChange={(e) => setToGodownId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select godown</option>
                {godowns.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct?.tracksBatches && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Batch *
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select batch</option>
                {batchOptions.map((s) => (
                  <option key={s.batchId} value={s.batchId!}>
                    {s.batchNumber} (available: {s.quantity})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Quantity *
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmitting ? "Transferring..." : "Transfer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
