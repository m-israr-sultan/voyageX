"use client";

import { useEffect, useState } from "react";
import { FaSpinner, FaRedo } from "react-icons/fa";
import { adminApi } from "@/lib/api";

export default function WebhooksPage() {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listWebhookEvents({
        page: 1,
        limit: 30,
        status: status || undefined,
        provider: provider || undefined,
      });
      const data = res.data?.data ?? res.data;
      setEvents(data?.items || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, provider]);

  const reprocess = async (id: string) => {
    await adminApi.reprocessWebhook(id);
    await load();
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Webhook Operations</h1>
        <p className="text-sm text-gray-500">Monitor, retry, and safely reprocess failed webhook events</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="FAILED">Failed</option>
          <option value="PROCESSED">Processed</option>
          <option value="RECEIVED">Received</option>
          <option value="REPLAYED">Replayed</option>
        </select>
        <input
          placeholder="Provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Retries</th>
                <th className="px-4 py-3">Time (ms)</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const ev = e as {
                  id: string;
                  provider: string;
                  eventType: string;
                  processingStatus: string;
                  retryCount: number;
                  processingTimeMs?: number;
                  failureReason?: string;
                };
                return (
                  <tr key={ev.id} className="border-t">
                    <td className="px-4 py-3">{ev.provider}</td>
                    <td className="px-4 py-3">{ev.eventType}</td>
                    <td className="px-4 py-3">{ev.processingStatus}</td>
                    <td className="px-4 py-3">{ev.retryCount}</td>
                    <td className="px-4 py-3">{ev.processingTimeMs ?? "—"}</td>
                    <td className="px-4 py-3">
                      {(ev.processingStatus === "FAILED" || ev.processingStatus === "RECEIVED") && (
                        <button
                          onClick={() => reprocess(ev.id)}
                          className="text-xs text-blue-700 flex items-center gap-1"
                        >
                          <FaRedo /> Reprocess
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {events.length === 0 && <p className="p-4 text-gray-500">No webhook events found.</p>}
        </div>
      )}
    </div>
  );
}
