import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { getCustomerLedger, type CustomerLedger } from "../lib/ledger-api";
import { LedgerView } from "./LedgerView";
import { SidePanel } from "./SidePanel";
import type { Customer } from "../lib/customers-api";

interface CustomerViewPanelProps {
  customer: Customer;
  onClose: () => void;
}

export function CustomerViewPanel({ customer, onClose }: CustomerViewPanelProps) {
  const { accessToken } = useAuth();
  const [ledger, setLedger] = useState<CustomerLedger | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getCustomerLedger(accessToken, customer.id)
      .then(setLedger)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, [accessToken, customer.id]);

  return (
    <SidePanel title={customer.name} onClose={onClose} widthClassName="max-w-xl">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !ledger ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <LedgerView
          party={ledger.customer}
          openingBalance={ledger.openingBalance}
          outstandingBalance={ledger.outstandingBalance}
          transactions={ledger.transactions}
        />
      )}
    </SidePanel>
  );
}
