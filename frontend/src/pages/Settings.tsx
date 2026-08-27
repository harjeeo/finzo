import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth-context";
import { getBusiness, updateBusiness, type Business } from "../lib/business-api";

export function Settings() {
  const { accessToken } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getBusiness(accessToken)
      .then(setBusiness)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!accessToken || !business) return;
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      const updated = await updateBusiness(accessToken, {
        name: business.name,
        gstin: business.gstin ?? undefined,
        pan: business.pan ?? undefined,
        address: business.address ?? undefined,
        city: business.city ?? undefined,
        state: business.state ?? undefined,
        pincode: business.pincode ?? undefined,
        invoicePrefix: business.invoicePrefix,
        currency: business.currency,
      });
      setBusiness(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const field = (key: keyof Business, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        value={(business?.[key] as string) ?? ""}
        onChange={(e) =>
          setBusiness((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
        }
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
      />
    </div>
  );

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-2xl space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <h2 className="text-sm font-medium text-gray-700">Business Profile</h2>

        {field("name", "Business Name")}

        <div className="grid grid-cols-2 gap-3">
          {field("gstin", "GSTIN")}
          {field("pan", "PAN")}
        </div>

        {field("address", "Address")}

        <div className="grid grid-cols-3 gap-3">
          {field("city", "City")}
          {field("state", "State")}
          {field("pincode", "Pincode")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("invoicePrefix", "Invoice Prefix")}
          {field("currency", "Currency")}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Saved successfully.</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
