import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import {
  getReportSummary,
  getStockReport,
  type ReportSummary,
  type StockReport,
} from "../lib/reports-api";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function Reports() {
  const { accessToken } = useAuth();
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [stockReport, setStockReport] = useState<StockReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [summaryData, stockData] = await Promise.all([
        getReportSummary(accessToken, from, to),
        getStockReport(accessToken),
      ]);
      setSummary(summaryData);
      setStockReport(stockData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const cards = summary
    ? [
        { label: "Sales", value: summary.sales.total, sub: `${summary.sales.count} invoices` },
        { label: "Purchases", value: summary.purchases.total, sub: `${summary.purchases.count} bills` },
        { label: "Expenses", value: summary.expenses.total, sub: `${summary.expenses.count} entries` },
        { label: "Net Profit", value: summary.netProfit, sub: "Sales − Purchases − Expenses" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <button
          onClick={loadSummary}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Apply
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ))
          : cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p
                  className={`mt-2 text-xl font-semibold ${
                    card.label === "Net Profit"
                      ? card.value >= 0
                        ? "text-green-700"
                        : "text-red-700"
                      : "text-gray-900"
                  }`}
                >
                  ₹{card.value.toFixed(2)}
                </p>
                <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
              </div>
            ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Stock Valuation</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {isLoading ? (
            <p className="p-6 text-sm text-gray-500">Loading...</p>
          ) : !stockReport || stockReport.items.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No products yet.</p>
          ) : (
            <>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Purchase Price</th>
                    <th className="px-4 py-3 font-medium">Stock Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stockReport.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.sku || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        ₹{item.purchasePrice}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹{item.stockValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between border-t border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">
                <span>Total Stock Value</span>
                <span>₹{stockReport.totalStockValue.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
