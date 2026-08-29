import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listProducts, type Product } from "../lib/products-api";
import {
  createDiscountScheme,
  deleteDiscountScheme,
  listDiscountSchemes,
  updateDiscountScheme,
  type DiscountScheme,
  type DiscountType,
} from "../lib/discount-schemes-api";

export function DiscountSchemes() {
  const { accessToken } = useAuth();
  const [schemes, setSchemes] = useState<DiscountScheme[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");
  const [value, setValue] = useState("");
  const [productId, setProductId] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [s, p] = await Promise.all([
        listDiscountSchemes(accessToken),
        listProducts(accessToken),
      ]);
      setSchemes(s);
      setProducts(p);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleCreate = async () => {
    if (!accessToken) return;
    setError(null);
    if (!name.trim() || !value) {
      setError("Name and value are required");
      return;
    }
    setIsSubmitting(true);
    try {
      await createDiscountScheme(accessToken, {
        name,
        discountType,
        value: Number(value),
        productId: productId || undefined,
        minQuantity: minQuantity ? Number(minQuantity) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setName("");
      setValue("");
      setProductId("");
      setMinQuantity("");
      setStartDate("");
      setEndDate("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scheme");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (scheme: DiscountScheme) => {
    if (!accessToken) return;
    await updateDiscountScheme(accessToken, scheme.id, { isActive: !scheme.isActive });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm("Delete this discount scheme?")) return;
    await deleteDiscountScheme(accessToken, id);
    await load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Discount Schemes</h1>

      <div className="mt-6 max-w-3xl rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-medium text-gray-700">New Scheme</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Applies to (blank = all products)
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as DiscountType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FLAT">Flat amount</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Value {discountType === "PERCENTAGE" ? "(%)" : "(₹)"} *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Min Quantity
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            <Add01Icon size={18} />
            {isSubmitting ? "Creating..." : "Create Scheme"}
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : schemes.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">No discount schemes yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Min Qty</th>
                <th className="px-4 py-3 font-medium">Window</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schemes.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.product?.name ?? "All products"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.discountType === "PERCENTAGE" ? `${s.value}%` : `₹${s.value}`}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.minQuantity}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.startDate ? new Date(s.startDate).toLocaleDateString("en-IN") : "-"}
                    {" → "}
                    {s.endDate ? new Date(s.endDate).toLocaleDateString("en-IN") : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Delete02Icon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
