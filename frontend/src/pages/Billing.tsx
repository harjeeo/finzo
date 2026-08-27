import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Add01Icon, Delete02Icon, Search01Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import { listCustomers, type Customer } from "../lib/customers-api";
import { listProducts, type Product } from "../lib/products-api";
import { createSalesInvoice } from "../lib/sales-api";

interface CartLine {
  product: Product;
  quantity: number;
}

const paymentModes = ["CASH", "UPI", "CARD"];

export function Billing() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    listCustomers(accessToken).then(setCustomers);
    listProducts(accessToken).then(setProducts);
  }, [accessToken]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q),
    );
  }, [products, search]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((line) => line.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((line) =>
        line.product.id === productId ? { ...line, quantity } : line,
      ),
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const subtotal = cart.reduce(
    (sum, line) => sum + line.quantity * Number(line.product.sellingPrice),
    0,
  );
  const taxTotal = cart.reduce(
    (sum, line) =>
      sum +
      line.quantity *
        Number(line.product.sellingPrice) *
        (Number(line.product.gstRate) / 100),
    0,
  );
  const grandTotal = subtotal + taxTotal;

  const handleCheckout = async () => {
    if (!accessToken) return;
    setError(null);

    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    if (cart.length === 0) {
      setError("Cart is empty");
      return;
    }

    setIsSubmitting(true);
    try {
      const invoice = await createSalesInvoice(accessToken, {
        customerId,
        paymentMode,
        amountPaid: grandTotal,
        items: cart.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
        })),
      });
      navigate(`/sales/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setIsSubmitting(false);
    }
  };

  const showCart = cart.length > 0;

  return (
    <div className="h-[calc(100vh-3rem)]">
      <div
        className={`flex h-full flex-col ${showCart ? "pr-96" : ""}`}
      >
        <h1 className="text-2xl font-semibold text-gray-900">Billing / POS</h1>

        <div className="relative mt-4">
          <Search01Icon
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU or barcode..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="mt-4 grid flex-1 auto-rows-min grid-cols-2 content-start items-start gap-3 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={Number(product.currentStock) <= 0}
              className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-purple-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="font-medium text-gray-900">{product.name}</span>
              <span className="mt-1 text-sm text-gray-500">
                ₹{product.sellingPrice}
              </span>
              <span className="mt-1 text-xs text-gray-400">
                Stock: {product.currentStock}
              </span>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <p className="col-span-full text-sm text-gray-500">
              No products found.
            </p>
          )}
        </div>
      </div>

      {showCart && (
        <div className="fixed inset-y-0 right-0 z-10 flex w-96 flex-col border-l border-gray-200 bg-white p-4 shadow-lg">
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

        <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-400">
              Cart is empty. Click a product to add it.
            </p>
          ) : (
            cart.map((line) => (
              <div
                key={line.product.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {line.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₹{line.product.sellingPrice} × {line.quantity} = ₹
                    {(
                      line.quantity * Number(line.product.sellingPrice)
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) =>
                      updateQuantity(line.product.id, Number(e.target.value))
                    }
                    className="w-14 rounded border border-gray-300 px-1 py-1 text-center text-sm"
                  />
                  <button
                    onClick={() => removeLine(line.product.id)}
                    className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Delete02Icon size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax</span>
            <span>₹{taxTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-gray-900">
            <span>Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700">
            Payment Mode
          </label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {paymentModes.map((mode) => (
              <button
                key={mode}
                onClick={() => setPaymentMode(mode)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  paymentMode === mode
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleCheckout}
          disabled={isSubmitting || cart.length === 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          <Add01Icon size={18} />
          {isSubmitting ? "Processing..." : `Charge ₹${grandTotal.toFixed(2)}`}
        </button>
        </div>
      )}
    </div>
  );
}
