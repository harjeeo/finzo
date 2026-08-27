import { useState, type FormEvent } from "react";
import { Cancel01Icon } from "hugeicons-react";
import type { EwayBillInput, TransportMode } from "../lib/eway-bill-api";

interface EwayBillModalProps {
  onClose: () => void;
  onSubmit: (input: EwayBillInput) => Promise<void>;
}

const TRANSPORT_MODES: TransportMode[] = ["ROAD", "RAIL", "AIR", "SHIP"];

export function EwayBillModal({ onClose, onSubmit }: EwayBillModalProps) {
  const [transporterName, setTransporterName] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>("ROAD");
  const [distanceKm, setDistanceKm] = useState("");
  const [ewbNumber, setEwbNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!distanceKm || Number(distanceKm) <= 0) {
      setError("Enter a valid distance in km");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        transporterName: transporterName || undefined,
        transporterId: transporterId || undefined,
        vehicleNumber: vehicleNumber || undefined,
        transportMode,
        distanceKm: Number(distanceKm),
        ewbNumber: ewbNumber || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Generate E-Way Bill
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Cancel01Icon size={20} />
          </button>
        </div>

        <p className="mb-4 text-xs text-gray-500">
          Fill these details to prepare the E-Way Bill for this consignment.
          If you've already generated the official EWB on the GST portal,
          paste its number below to keep this record in sync.
        </p>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transport Mode
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0) + mode.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Distance (km) *
              </label>
              <input
                required
                type="number"
                min="1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicle Number
            </label>
            <input
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MH12AB1234"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transporter Name
              </label>
              <input
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Transporter GSTIN
              </label>
              <input
                value={transporterId}
                onChange={(e) => setTransporterId(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Official EWB Number (optional)
            </label>
            <input
              value={ewbNumber}
              onChange={(e) => setEwbNumber(e.target.value)}
              placeholder="From the GST E-Way Bill portal, if already generated"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

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
              {isSubmitting ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
