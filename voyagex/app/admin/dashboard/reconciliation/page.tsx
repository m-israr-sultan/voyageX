"use client";

import { useEffect, useState } from "react";
import { FaSpinner, FaPlay, FaCheck } from "react-icons/fa";
import { adminApi } from "@/lib/api";

export default function ReconciliationPage() {
  const [reports, setReports] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listReconciliationReports({ page: 1, limit: 20 });
      const data = res.data?.data ?? res.data;
      setReports(data?.items || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runManual = async () => {
    setRunning(true);
    try {
      await adminApi.runReconciliation({ period: "MANUAL" });
      await load();
    } finally {
      setRunning(false);
    }
  };

  const resolve = async (issueId: string) => {
    await adminApi.resolveReconciliationIssue(issueId);
    await load();
  };

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Reconciliation</h1>
          <p className="text-sm text-gray-500">Ledger, payments, payouts, receipts, and webhook alignment</p>
        </div>
        <button
          onClick={runManual}
          disabled={running}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {running ? <FaSpinner className="animate-spin" /> : <FaPlay />}
          Run Manual Reconciliation
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><FaSpinner className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => {
            const report = r as {
              id: string;
              period: string;
              status: string;
              issueCount: number;
              createdAt: string;
              issues?: Array<{ id: string; issueType: string; severity: string; description: string }>;
            };
            return (
              <div key={report.id} className="bg-white border rounded-xl p-4">
                <div className="flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-medium">{report.period} — {report.status}</p>
                    <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="text-sm">{report.issueCount} issues</span>
                </div>
                {report.issues && report.issues.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {report.issues.map((issue) => (
                      <li key={issue.id} className="text-sm flex justify-between gap-2 border-t pt-2">
                        <span>
                          <span className="font-mono text-xs text-amber-700">{issue.severity}</span>{" "}
                          {issue.description}
                        </span>
                        <button
                          onClick={() => resolve(issue.id)}
                          className="text-xs text-green-700 flex items-center gap-1 shrink-0"
                        >
                          <FaCheck /> Resolve
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
          {reports.length === 0 && <p className="text-gray-500 text-sm">No reconciliation reports yet.</p>}
        </div>
      )}
    </div>
  );
}
