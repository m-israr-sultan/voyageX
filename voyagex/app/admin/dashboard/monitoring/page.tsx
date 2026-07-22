"use client";

import { useEffect, useState } from "react";
import { FaSpinner, FaSync, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from "react-icons/fa";
import { monitoringApi } from "@/lib/api";

type ProbeStatus = "up" | "down" | "degraded" | "not_configured" | "not_tracked";

function StatusBadge({ status }: { status: ProbeStatus }) {
  const map: Record<ProbeStatus, { label: string; className: string; icon: React.ReactNode }> = {
    up: { label: "Healthy", className: "bg-green-100 text-green-800", icon: <FaCheckCircle className="w-3 h-3" /> },
    down: { label: "Down", className: "bg-red-100 text-red-800", icon: <FaTimesCircle className="w-3 h-3" /> },
    degraded: { label: "Degraded", className: "bg-amber-100 text-amber-800", icon: <FaExclamationTriangle className="w-3 h-3" /> },
    not_configured: { label: "Not Configured", className: "bg-gray-100 text-gray-600", icon: <FaExclamationTriangle className="w-3 h-3" /> },
    not_tracked: { label: "Not Tracked", className: "bg-gray-100 text-gray-500", icon: <FaExclamationTriangle className="w-3 h-3" /> },
  };
  const cfg = map[status] ?? map.not_tracked;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await monitoringApi.getHealth();
      setHealth(res.data?.data ?? res.data);
      setLastChecked(new Date());
    } catch (err) {
      console.error("Failed to load health status:", err);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">System Health</h1>
          <p className="text-sm text-gray-500">
            Deployment status, infrastructure health, and background job monitoring
            {lastChecked && <span className="ml-2 text-gray-400">· Last checked {lastChecked.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg flex items-center gap-2">
          <FaSync className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading && !health ? (
        <div className="flex justify-center py-16"><FaSpinner className="animate-spin text-gray-400 text-2xl" /></div>
      ) : !health ? (
        <div className="bg-white border rounded-xl p-6 text-center text-gray-500">
          Could not reach the backend health endpoint.
        </div>
      ) : (
        <>
          {/* Warnings banner */}
          {health.warnings?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <FaExclamationTriangle /> {health.warnings.length} active warning{health.warnings.length > 1 ? "s" : ""}
              </p>
              <ul className="space-y-1">
                {health.warnings.map((w: string, i: number) => (
                  <li key={i} className="text-sm text-amber-700">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Deployment info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-500">Version</p>
              <p className="text-lg font-semibold mt-1">{health.version}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-500">Environment</p>
              <p className="text-lg font-semibold mt-1 capitalize">{health.environment}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-500">Backend Uptime</p>
              <p className="text-lg font-semibold mt-1">{formatUptime(health.uptimeSeconds)}</p>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-500">DB Response Time</p>
              <p className="text-lg font-semibold mt-1">{health.database?.responseTimeMs ?? "—"}ms</p>
            </div>
          </div>

          {/* API latency */}
          <div className="bg-white border rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 mb-4">API Response Time</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold text-gray-900">{health.apiLatency?.avgMs ?? "—"}{health.apiLatency?.avgMs != null ? "ms" : ""}</p>
                <p className="text-xs text-gray-500">Average</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold text-gray-900">{health.apiLatency?.p50Ms ?? "—"}{health.apiLatency?.p50Ms != null ? "ms" : ""}</p>
                <p className="text-xs text-gray-500">p50</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold text-gray-900">{health.apiLatency?.p95Ms ?? "—"}{health.apiLatency?.p95Ms != null ? "ms" : ""}</p>
                <p className="text-xs text-gray-500">p95</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold text-gray-900">{health.apiLatency?.sampleCount ?? 0}</p>
                <p className="text-xs text-gray-500">Samples</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Rolling in-process sample of recent API requests (analytics beacons excluded). Resets on backend restart.
            </p>
          </div>

          {/* Infrastructure health */}
          <div className="bg-white border rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Infrastructure</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-gray-700">Database</span>
                <StatusBadge status={health.database?.status} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-gray-700">Storage (Supabase)</span>
                <StatusBadge status={health.storage?.status} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-gray-700">Messages WebSocket</span>
                <StatusBadge status={health.websocket?.messages?.status} />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm text-gray-700">Notifications WebSocket</span>
                <StatusBadge status={health.websocket?.notifications?.status} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm text-gray-500">
              <p>Messages clients connected: <span className="font-medium text-gray-800">{health.websocket?.messages?.connectedClients ?? 0}</span></p>
              <p>Notifications clients connected: <span className="font-medium text-gray-800">{health.websocket?.notifications?.connectedClients ?? 0}</span></p>
            </div>
          </div>

          {/* Background jobs */}
          <div className="bg-white border rounded-xl p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Background Jobs (last 24h)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {Object.entries(health.backgroundJobs?.webhooks?.last24h ?? {}).map(([key, value]) => (
                <div key={key} className="text-center p-3 border rounded-lg">
                  <p className="text-lg font-semibold text-gray-900">{value as number}</p>
                  <p className="text-xs text-gray-500 capitalize">{key}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 border rounded-lg text-center">
                <p className="text-lg font-semibold text-gray-900">{health.backgroundJobs?.failedPayouts24h ?? 0}</p>
                <p className="text-xs text-gray-500">Failed Payouts</p>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <p className="text-lg font-semibold text-gray-900">{health.backgroundJobs?.failedRefunds24h ?? 0}</p>
                <p className="text-xs text-gray-500">Failed Refunds</p>
              </div>
            </div>
            {health.backgroundJobs?.webhooks?.recentFailures?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Recent Failed Webhook Events</p>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {health.backgroundJobs.webhooks.recentFailures.map((f: any) => (
                    <div key={f.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                      <span className="text-gray-700">{f.provider} · {f.eventType}</span>
                      <span className="text-xs text-gray-400">retries: {f.retryCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Email delivery */}
          <div className="bg-white border rounded-xl p-4 sm:p-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Email Delivery</h2>
              <p className="text-sm text-gray-500">{health.emailDelivery?.detail}</p>
            </div>
            <StatusBadge status={health.emailDelivery?.status} />
          </div>
        </>
      )}
    </div>
  );
}
