import { useEffect, useState } from "react";
import { Download04Icon } from "hugeicons-react";
import { useAuth } from "../lib/auth-context";
import {
  downloadGstr1Csv,
  getGstr1,
  getGstr3b,
  type Gstr1Report,
  type Gstr3bSummary,
} from "../lib/gstr-api";

function firstDayOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

type Tab = "gstr1" | "gstr3b";

export function GstReports() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>("gstr1");
  const [from, setFrom] = useState(firstDayOfMonth());
  const [to, setTo] = useState(today());
  const [gstr1, setGstr1] = useState<Gstr1Report | null>(null);
  const [gstr3b, setGstr3b] = useState<Gstr3bSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const [gstr1Data, gstr3bData] = await Promise.all([
        getGstr1(accessToken, from, to),
        getGstr3b(accessToken, from, to),
      ]);
      setGstr1(gstr1Data);
      setGstr3b(gstr3bData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load GST reports");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleExport = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      await downloadGstr1Csv(accessToken, from, to);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">GST Reports</h1>

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
          onClick={load}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Apply
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <Download04Icon size={16} />
          {isExporting ? "Exporting..." : "Export GSTR-1 CSV"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab("gstr1")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "gstr1"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          GSTR-1
        </button>
        <button
          onClick={() => setTab("gstr3b")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "gstr3b"
              ? "border-b-2 border-purple-600 text-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          GSTR-3B
        </button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-gray-500">Loading...</p>
      ) : tab === "gstr1" ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {!gstr1 || gstr1.rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No sales invoices in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice #</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">GSTIN</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Place of Supply</th>
                    <th className="px-4 py-3 font-medium">Taxable Value</th>
                    <th className="px-4 py-3 font-medium">IGST</th>
                    <th className="px-4 py-3 font-medium">CGST</th>
                    <th className="px-4 py-3 font-medium">SGST</th>
                    <th className="px-4 py-3 font-medium">Invoice Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {gstr1.rows.map((row) => (
                    <tr key={row.invoiceNumber}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {row.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(row.invoiceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.customerName}</td>
                      <td className="px-4 py-3 text-gray-600">{row.gstin ?? "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{row.supplyType}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.placeOfSupply ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        ₹{row.taxableValue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">₹{row.igst.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">₹{row.cgst.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">₹{row.sgst.toFixed(2)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        ₹{row.invoiceValue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-gray-900">
                    <td className="px-4 py-3" colSpan={6}>
                      TOTAL
                    </td>
                    <td className="px-4 py-3">₹{gstr1.totals.taxableValue.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{gstr1.totals.igst.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{gstr1.totals.cgst.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{gstr1.totals.sgst.toFixed(2)}</td>
                    <td className="px-4 py-3">₹{gstr1.totals.invoiceValue.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ) : (
        gstr3b && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-medium text-gray-700">Outward Supplies</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Taxable Value</dt>
                  <dd>₹{gstr3b.outward.taxableValue.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-gray-600">
                  <dt>IGST</dt>
                  <dd>₹{gstr3b.outward.igst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-gray-600">
                  <dt>CGST</dt>
                  <dd>₹{gstr3b.outward.cgst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-gray-600">
                  <dt>SGST</dt>
                  <dd>₹{gstr3b.outward.sgst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
                  <dt>Total Tax</dt>
                  <dd>₹{gstr3b.outward.total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h2 className="text-sm font-medium text-gray-700">Inward Supplies (ITC)</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <dt>Taxable Value</dt>
                  <dd>₹{gstr3b.inwardItc.taxableValue.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
                  <dt>Total ITC</dt>
                  <dd>₹{gstr3b.inwardItc.total.toFixed(2)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-gray-400">
                Pooled figure — purchases don't yet capture inter/intra-state split.
              </p>
            </div>
            <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
              <h2 className="text-sm font-medium text-purple-700">Net Tax Payable</h2>
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex justify-between text-purple-700">
                  <dt>IGST</dt>
                  <dd>₹{gstr3b.netTaxPayable.igst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-purple-700">
                  <dt>CGST</dt>
                  <dd>₹{gstr3b.netTaxPayable.cgst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between text-purple-700">
                  <dt>SGST</dt>
                  <dd>₹{gstr3b.netTaxPayable.sgst.toFixed(2)}</dd>
                </div>
                <div className="flex justify-between border-t border-purple-200 pt-1 text-base font-semibold text-purple-900">
                  <dt>Total</dt>
                  <dd>₹{gstr3b.netTaxPayable.total.toFixed(2)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )
      )}
    </div>
  );
}
