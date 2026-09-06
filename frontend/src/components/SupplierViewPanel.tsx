import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { getSupplierLedger, type SupplierLedger } from "../lib/ledger-api";
import { LedgerView } from "./LedgerView";
import { SidePanel } from "./SidePanel";
import type { Supplier } from "../lib/suppliers-api";

interface SupplierViewPanelProps {
  supplier: Supplier;
  onClose: () => void;
}

export function SupplierViewPanel({ supplier, onClose }: SupplierViewPanelProps) {
  const { accessToken } = useAuth();
  const [ledger, setLedger] = useState<SupplierLedger | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getSupplierLedger(accessToken, supplier.id)
      .then(setLedger)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, supplier.id]);

  return (
    <SidePanel title={supplier.name} onClose={onClose} widthClassName="max-w-xl">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !ledger ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <LedgerView
          party={ledger.supplier}
          openingBalance={ledger.openingBalance}
          outstandingBalance={ledger.outstandingBalance}
          transactions={ledger.transactions}
        />
      )}
    </SidePanel>
  );
}
