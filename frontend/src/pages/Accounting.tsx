import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth-context";
import { ChartOfAccountsTab } from "../components/accounting/ChartOfAccountsTab";
import { JournalEntriesTab } from "../components/accounting/JournalEntriesTab";
import { LedgerTab } from "../components/accounting/LedgerTab";
import { TrialBalanceTab } from "../components/accounting/TrialBalanceTab";
import { listAccounts, type Account } from "../lib/accounting-api";

type Tab = "accounts" | "journal" | "ledger" | "trial-balance";

const tabs: { key: Tab; label: string }[] = [
  { key: "accounts", label: "Chart of Accounts" },
  { key: "journal", label: "Journal Entries" },
  { key: "ledger", label: "General Ledger" },
  { key: "trial-balance", label: "Trial Balance" },
];

export function Accounting() {
  const { accessToken } = useAuth();
  const [tab, setTab] = useState<Tab>("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);

  const loadAccounts = async () => {
    if (!accessToken) return;
    setAccounts(await listAccounts(accessToken));
  };

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Accounting</h1>

      <div className="mt-4 flex gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.key
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "accounts" && (
          <ChartOfAccountsTab
            accounts={accounts}
            onChanged={loadAccounts}
          />
        )}
        {tab === "journal" && <JournalEntriesTab accounts={accounts} />}
        {tab === "ledger" && <LedgerTab accounts={accounts} />}
        {tab === "trial-balance" && <TrialBalanceTab />}
      </div>
    </div>
  );
}
