import { useState, type FormEvent } from "react";
import { Cancel01Icon } from "hugeicons-react";

interface ReturnableItem {
  productId: string;
  productName: string;
  maxReturnable: number;
}

interface CreateReturnModalProps {
  title: string;
  items: ReturnableItem[];
  onClose: () => void;
  onSubmit: (items: { productId: string; quantity: number }[]) => Promise<void>;
}

export function CreateReturnModal({
  title,
  items,
  onClose,
  onSubmit,
}: CreateReturnModalProps) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const selected = Object.entries(quantities)
      .map(([productId, qty]) => ({ productId, quantity: Number(qty) }))
      .filter((item) => item.quantity > 0);

    if (selected.length === 0) {
      setError("Enter a quantity for at least one item");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(selected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">
                  Max returnable: {item.maxReturnable}
                </p>
              </div>
              <input
                type="number"
                min="0"
                max={item.maxReturnable}
                step="0.01"
                disabled={item.maxReturnable <= 0}
                value={quantities[item.productId] ?? ""}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.productId]: e.target.value,
                  }))
                }
                placeholder="0"
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:bg-gray-50"
              />
            </div>
          ))}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Create Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
