import { useEffect, useState } from "react";
import { Cancel01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createProductUnit,
  deleteProductUnit,
  listProductUnits,
  type Product,
  type ProductUnit,
} from "../lib/products-api";

interface ProductUnitsModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductUnitsModal({ product, onClose }: ProductUnitsModalProps) {
  const { accessToken } = useAuth();
  const [units, setUnits] = useState<ProductUnit[]>(product.units ?? []);
  const [name, setName] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    const data = await listProductUnits(accessToken, product.id);
    setUnits(data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, product.id]);

  const handleAdd = async () => {
    if (!accessToken) return;
    setError(null);
    if (!name.trim()) {
      setError("Unit name is required");
      return;
    }
    const factor = Number(conversionFactor);
    if (!factor || factor <= 0) {
      setError(`Enter how many ${product.unit} make up 1 ${name}`);
      return;
    }
    setIsSubmitting(true);
    try {
      await createProductUnit(accessToken, product.id, { name, conversionFactor: factor });
      setName("");
      setConversionFactor("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (unit: ProductUnit) => {
    if (!accessToken) return;
    if (!confirm(`Remove unit "${unit.name}"?`)) return;
    await deleteProductUnit(accessToken, product.id, unit.id);
    await load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Units — {product.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Base unit: <span className="font-medium text-gray-700">{product.unit}</span>
        </p>

        <div className="mt-4 space-y-2">
          {units.length === 0 ? (
            <p className="text-sm text-gray-400">No secondary units configured.</p>
          ) : (
            units.map((unit) => (
              <div
                key={unit.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <span>
                  1 {unit.name} = {unit.conversionFactor} {product.unit}
                </span>
                <button
                  onClick={() => handleDelete(unit)}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove unit"
                >
                  <Delete02Icon size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 flex items-end gap-2 border-t border-gray-200 pt-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              Unit name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Box"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium text-gray-700">
              = ? {product.unit}
            </label>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={conversionFactor}
              onChange={(e) => setConversionFactor(e.target.value)}
              placeholder="12"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={isSubmitting}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
