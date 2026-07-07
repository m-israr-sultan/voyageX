"use client";

import { useEffect, useState } from "react";
import { FaSpinner, FaDownload } from "react-icons/fa";
import { adminApi } from "@/lib/api";

type Metrics = {
  gmv: number;
  platformCommissionRevenue: number;
  guidePayouts: number;
  pendingEscrow: { amount: number; count: number };
  pendingPayouts: number;
  completedPayouts: { amount: number; count: number };
  failedPayouts: number;
  agencySubscriptionRevenue: number;
  refundTotals: number;
  outstandingReconciliationIssues: number;
  webhookFailures: number;
  sandboxMode: boolean;
  providerHealth: Array<{ provider: string; sandbox: boolean; ready: boolean }>;
  accounting: {
    gmv: number;
    platformRevenue: number;
    guideEarnings: number;
    voyagexRevenue: number;
    currency: string;
  };
};

function formatPkr(n: number) {
  return `PKR ${n.toLocaleString()}`;
}

export default function FinancialHealthPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getFinancialMetrics({
        from: from || undefined,
        to: to || undefined,
      });
      setMetrics(res.data?.data ?? res.data);
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const exportCsv = async () => {
    const res = await adminApi.exportFinancialMetrics({ from: from || undefined, to: to || undefined });
    const blob = new Blob([res.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-health-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const cards = metrics
    ? [
        { label: "Gross Marketplace Value", value: formatPkr(metrics.gmv) },
        { label: "Platform Commission", value: formatPkr(metrics.platformCommissionRevenue) },
        { label: "VoyageX Revenue", value: formatPkr(metrics.accounting.voyagexRevenue) },
        { label: "Guide Payouts", value: formatPkr(metrics.guidePayouts) },
        { label: "Pending Escrow", value: `${formatPkr(metrics.pendingEscrow.amount)} (${metrics.pendingEscrow.count})` },
        { label: "Pending Payouts", value: String(metrics.pendingPayouts) },
        { label: "Completed Payouts", value: formatPkr(metrics.completedPayouts.amount) },
        { label: "Failed Payouts", value: String(metrics.failedPayouts) },
        { label: "Agency Subscriptions", value: formatPkr(metrics.agencySubscriptionRevenue) },
        { label: "Refund Totals", value: formatPkr(metrics.refundTotals) },
        { label: "Reconciliation Issues", value: String(metrics.outstandingReconciliationIssues) },
        { label: "Webhook Failures", value: String(metrics.webhookFailures) },
      ]
    : [];

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Financial Health</h1>
          <p className="text-sm text-gray-500">GMV, revenue, escrow, payouts, and provider readiness</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="px-3 py-2 text-sm border rounded-lg flex items-center gap-2">
            <FaDownload /> Export
          </button>
          <button onClick={load} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg">
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
        <button onClick={load} className="px-3 py-2 text-sm border rounded-lg">Apply</button>
      </div>

      {metrics && (
        <div className="text-sm text-gray-600">
          Mode: <span className="font-medium">{metrics.sandboxMode ? "Sandbox" : "Live"}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-gray-400" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="bg-white border rounded-xl p-4">
                <p className="text-xs text-gray-500">{c.label}</p>
                <p className="text-lg font-semibold mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          {metrics?.providerHealth && (
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-medium mb-3">Provider Health</h2>
              <div className="flex flex-wrap gap-2">
                {metrics.providerHealth.map((p) => (
                  <span
                    key={p.provider}
                    className={`px-3 py-1 rounded-full text-xs ${
                      p.ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {p.provider}: {p.ready ? "Ready" : "Missing credentials"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
