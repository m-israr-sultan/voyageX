"use client";

import { useEffect, useState } from "react";
import {
  FaSpinner,
  FaSearch,
  FaDownload,
  FaFileAlt,
  FaBook,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";

type Tab = "receipts" | "ledger";

export default function AdminFinancialRecordsPage() {
  const [tab, setTab] = useState<Tab>("receipts");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { search: search || undefined, type: typeFilter || undefined, page, limit: 25 };
      const response =
        tab === "receipts"
          ? await adminApi.listFinancialReceipts(params)
          : await adminApi.listFinancialLedger(params);
      const data = response.data?.data ?? response.data;
      setItems(data?.items || []);
      setTotalPages(data?.pagination?.totalPages || 1);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tab, page, typeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const downloadReceipt = async (id: string, receiptNumber: string) => {
    try {
      const response = await adminApi.downloadReceipt(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${receiptNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Financial Records</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Receipts, invoices, and immutable ledger entries
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setTab("receipts"); setPage(1); }}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
            tab === "receipts" ? "bg-gray-900 text-white" : "bg-white border border-gray-200"
          }`}
        >
          <FaFileAlt /> Receipts
        </button>
        <button
          onClick={() => { setTab("ledger"); setPage(1); }}
          className={`px-4 py-2 text-sm rounded-lg flex items-center gap-2 ${
            tab === "ledger" ? "bg-gray-900 text-white" : "bg-white border border-gray-200"
          }`}
        >
          <FaBook /> Ledger
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, receipt number..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">
            Search
          </button>
        </form>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {tab === "receipts" ? (
            <>
              <option value="PAYMENT">Payment</option>
              <option value="PAYOUT">Payout</option>
              <option value="ESCROW">Escrow</option>
              <option value="SUBSCRIPTION">Subscription</option>
              <option value="REFUND">Refund</option>
            </>
          ) : (
            <>
              <option value="TRAVELER_PAYMENT">Traveler Payment</option>
              <option value="ESCROW_HOLD">Escrow Hold</option>
              <option value="ESCROW_RELEASE">Escrow Release</option>
              <option value="GUIDE_PAYOUT">Guide Payout</option>
              <option value="AGENCY_SUBSCRIPTION">Subscription</option>
              <option value="REFUND">Refund</option>
              <option value="COMMISSION">Commission</option>
            </>
          )}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <FaSpinner className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {tab === "receipts" ? (
                    <>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Receipt #</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Remarks</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : tab === "receipts" ? (
                  items.map((item) => (
                    <tr key={String(item.id)} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{String(item.receiptNumber)}</td>
                      <td className="px-4 py-3">{String(item.receiptType)}</td>
                      <td className="px-4 py-3 text-xs">{String(item.voyagexReference)}</td>
                      <td className="px-4 py-3">{String(item.status)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {item.generatedAt
                          ? new Date(String(item.generatedAt)).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {Boolean(item.pdfPath) && (
                          <button
                            onClick={() => downloadReceipt(String(item.id), String(item.receiptNumber))}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 border rounded hover:bg-gray-50"
                          >
                            <FaDownload className="w-3 h-3" /> PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  items.map((item) => (
                    <tr key={String(item.id)} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs font-medium">{String(item.referenceNumber)}</td>
                      <td className="px-4 py-3">{String(item.ledgerType)}</td>
                      <td className="px-4 py-3 text-right">Rs {Number(item.amount).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                        {String(item.remarks || "—")}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(String(item.createdAt)).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
