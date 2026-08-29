import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listProducts, type Product } from "../lib/products-api";
import {
  createPriceList,
  deletePriceList,
  listPriceLists,
  removePriceListItem,
  setPriceListItem,
  updatePriceList,
  type PriceList,
} from "../lib/price-lists-api";

export function PriceLists() {
  const { accessToken } = useAuth();
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [itemProductId, setItemProductId] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [pl, prods] = await Promise.all([
        listPriceLists(accessToken),
        listProducts(accessToken),
      ]);
      setPriceLists(pl);
      setProducts(prods);
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
    if (!accessToken || !newName.trim()) return;
    try {
      await createPriceList(accessToken, { name: newName });
      setNewName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create price list");
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!confirm("Delete this price list?")) return;
    try {
      await deletePriceList(accessToken, id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!accessToken) return;
    await updatePriceList(accessToken, id, { isDefault: true });
    await load();
  };

  const handleAddItem = async (priceListId: string) => {
    if (!accessToken || !itemProductId || !itemPrice) return;
    await setPriceListItem(accessToken, priceListId, itemProductId, Number(itemPrice));
    setItemProductId("");
    setItemPrice("");
    await load();
  };

  const handleRemoveItem = async (priceListId: string, productId: string) => {
    if (!accessToken) return;
    await removePriceListItem(accessToken, priceListId, productId);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Price Lists</h1>
      </div>

      <div className="mt-4 flex items-end gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            New price list name
          </label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Wholesale"
            className="mt-1 w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Create
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : priceLists.length === 0 ? (
          <p className="text-sm text-gray-500">No price lists yet.</p>
        ) : (
          priceLists.map((pl) => (
            <div key={pl.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <button
                  onClick={() => setExpandedId(expandedId === pl.id ? null : pl.id)}
                  className="flex items-center gap-2 text-left"
                >
                  <span className="font-medium text-gray-900">{pl.name}</span>
                  {pl.isDefault && (
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                      Default
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {pl.items.length} product{pl.items.length === 1 ? "" : "s"}
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  {!pl.isDefault && (
                    <button
                      onClick={() => handleSetDefault(pl.id)}
                      className="text-xs font-medium text-purple-600 hover:underline"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(pl.id)}
                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Delete02Icon size={16} />
                  </button>
                </div>
              </div>

              {expandedId === pl.id && (
                <div className="p-4">
                  {pl.items.length > 0 && (
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase text-gray-500">
                        <tr>
                          <th className="pb-2 font-medium">Product</th>
                          <th className="pb-2 font-medium">Price</th>
                          <th className="pb-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pl.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2 text-gray-900">{item.product.name}</td>
                            <td className="py-2 text-gray-600">₹{item.price}</td>
                            <td className="py-2 text-right">
                              <button
                                onClick={() => handleRemoveItem(pl.id, item.productId)}
                                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                aria-label="Remove"
                              >
                                <Delete02Icon size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div className="mt-3 flex items-end gap-2 border-t border-gray-100 pt-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Product
                      </label>
                      <select
                        value={itemProductId}
                        onChange={(e) => setItemProductId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (₹{p.sellingPrice})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium text-gray-700">
                        Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      onClick={() => handleAddItem(pl.id)}
                      className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
                    >
                      Set price
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
