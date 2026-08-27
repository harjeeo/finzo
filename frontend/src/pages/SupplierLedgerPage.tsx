import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { getSupplierLedger, type SupplierLedger } from "../lib/ledger-api";
import { LedgerView } from "../components/LedgerView";

export function SupplierLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuth();
  const [ledger, setLedger] = useState<SupplierLedger | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !id) return;
    getSupplierLedger(accessToken, id)
      .then(setLedger)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!ledger) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <LedgerView
      backTo="/suppliers"
      backLabel="Back to Suppliers"
      party={ledger.supplier}
      openingBalance={ledger.openingBalance}
      outstandingBalance={ledger.outstandingBalance}
      transactions={ledger.transactions}
    />
  );
}
