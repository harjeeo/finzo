import { useEffect, useState } from "react";
import { Add01Icon, Delete02Icon, PencilEdit01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
  type Product,
  type ProductInput,
} from "../lib/products-api";
import { ProductFormModal } from "../components/ProductFormModal";

export function Products() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<
    { mode: "create" } | { mode: "edit"; product: Product } | null
  >(null);

  const loadProducts = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await listProducts(accessToken);
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSubmit = async (input: ProductInput) => {
    if (!accessToken) return;
    if (modalState?.mode === "edit") {
      await updateProduct(accessToken, modalState.product.id, input);
    } else {
      await createProduct(accessToken, input);
    }
    setModalState(null);
    await loadProducts();
  };

  const handleDelete = async (product: Product) => {
    if (!accessToken) return;
    if (!confirm(`Delete product "${product.name}"?`)) return;
    await deleteProduct(accessToken, product.id);
    await loadProducts();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <button
          onClick={() => setModalState({ mode: "create" })}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          <Add01Icon size={18} />
          Add Product
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-6 text-sm text-gray-500">Loading...</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : products.length === 0 ? (
          <p className="p-6 text-sm text-gray-500">
            No products yet. Add your first product to get started.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Selling Price</th>
                <th className="px-4 py-3 font-medium">GST %</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => {
                const isLowStock =
                  Number(product.currentStock) <= Number(product.minStockLevel) &&
                  Number(product.minStockLevel) > 0;
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.sku || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.category || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      ₹{product.sellingPrice}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {product.gstRate}%
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          isLowStock
                            ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600"
                            : "text-gray-600"
                        }
                      >
                        {product.currentStock} {product.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setModalState({ mode: "edit", product })
                          }
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          aria-label="Edit"
                        >
                          <PencilEdit01Icon size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalState && (
        <ProductFormModal
          product={modalState.mode === "edit" ? modalState.product : null}
          onClose={() => setModalState(null)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
