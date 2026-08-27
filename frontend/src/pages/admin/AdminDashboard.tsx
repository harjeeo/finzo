import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { getPlatformStats, type PlatformStats } from "../../lib/super-admin-api";

export function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setIsLoading(true);
    getPlatformStats(accessToken)
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const cards = stats
    ? [
        { label: "Total Businesses", value: stats.businessCount },
        { label: "Active Businesses", value: stats.activeBusinessCount },
        { label: "Suspended Businesses", value: stats.suspendedBusinessCount },
        { label: "Total Users", value: stats.userCount },
        { label: "New This Month", value: stats.newBusinessesThisMonth },
        {
          label: "Sales This Month",
          value: `₹${stats.salesThisMonth.total.toFixed(2)}`,
          sub: `${stats.salesThisMonth.count} invoices`,
        },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Platform Dashboard</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">Loading...</p>
              </div>
            ))
          : cards.map((card) => (
              <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="mt-2 text-xl font-semibold text-gray-900">
                  {card.value}
                </p>
                {"sub" in card && (
                  <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
