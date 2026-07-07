"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FaSpinner,
  FaDollarSign,
  FaChartBar,
  FaExclamationTriangle,
  FaWallet,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
} from "react-icons/fa";
import Link from "next/link";
import { guideFinancialApi } from "@/lib/api";

interface WalletSummary {
  lifetimeEarnings: number;
  pendingBalance: number;
  totalCommission: number;
  currency: string;
}

interface PayoutRecord {
  id: string;
  status: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  voyagexReference: string;
  providerReference?: string | null;
  failureReason?: string | null;
  createdAt: string;
  completedAt?: string | null;
  bookings?: {
    id: string;
    startDate?: string;
    endDate?: string;
    packages?: { title?: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  SUCCESS: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};

export default function EarningsPage() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await guideFinancialApi.getWallet({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 20,
      });
      const result = response.data;
      if (result.success) {
        const data = result.data;
        setSummary(data?.summary || null);
        setPayouts(data?.payouts || []);
        setTotalPages(data?.pagination?.totalPages || 1);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWallet();
  };

  const completedPayouts = payouts.filter((p) => p.status === "SUCCESS");

  const monthlyData = completedPayouts.reduce(
    (acc: Record<string, { earnings: number; count: number }>, p) => {
      const date = p.completedAt || p.createdAt;
      const month = new Date(date).toLocaleString("default", { month: "short", year: "numeric" });
      if (!acc[month]) acc[month] = { earnings: 0, count: 0 };
      acc[month].earnings += p.netAmount;
      acc[month].count += 1;
      return acc;
    },
    {},
  );

  const months = Object.keys(monthlyData).reverse();
  const earningsValues = months.map((m) => monthlyData[m].earnings);
  const maxEarnings = Math.max(...earningsValues, 1);

  if (loading && !summary) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse" />
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse" />
              <div className="h-6 sm:h-7 bg-gray-200 rounded w-24 sm:w-32 mb-1 animate-pulse" />
              <div className="h-3 sm:h-4 bg-gray-100 rounded w-20 sm:w-24 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Earnings & Wallet</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track payouts and lifetime earnings</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load wallet</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={() => fetchWallet()}
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Earnings & Wallet</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Automatic payouts after escrow release
          </p>
        </div>
        <Link
          href="/guide-panel/dashboard/payout-accounts"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
        >
          <FaWallet className="w-4 h-4" /> Manage Payout Accounts
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Rs {(summary?.lifetimeEarnings ?? 0).toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500">Lifetime Earnings</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Rs {(summary?.pendingBalance ?? 0).toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500">Pending Payouts</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaTimesCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
            Rs {(summary?.totalCommission ?? 0).toLocaleString()}
          </h3>
          <p className="text-xs text-gray-500">Commission Deducted</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{completedPayouts.length}</h3>
          <p className="text-xs text-gray-500">Completed Payouts</p>
        </div>
      </div>

      {months.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Monthly Payouts</h2>
          <div className="space-y-3">
            {months.map((month, i) => {
              const earnings = earningsValues[i];
              const percentage = (earnings / maxEarnings) * 100;
              const count = monthlyData[month].count;
              return (
                <div key={month} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-600 w-24 font-medium">{month}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-[#008A1E] h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                          style={{ width: `${percentage}%`, minWidth: "40px" }}
                        >
                          <span className="text-xs text-white font-medium">
                            Rs {earnings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">
                        ({count})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Transaction History</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reference..."
                  className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-40 sm:w-48"
                />
              </div>
              <button type="submit" className="px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg">
                Search
              </button>
            </form>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SUCCESS">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-8">
            <FaChartBar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No payout transactions yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Payouts are created automatically when escrow is released after tour completion
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {payout.bookings?.packages?.title || "Tour Payout"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {payout.voyagexReference} · {new Date(payout.createdAt).toLocaleDateString()}
                  </p>
                  {payout.failureReason && (
                    <p className="text-xs text-red-500 mt-0.5">{payout.failureReason}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${payout.status === "FAILED" ? "text-red-600" : "text-green-600"}`}>
                    {payout.status === "FAILED" ? "" : "+"} Rs {payout.netAmount.toLocaleString()}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[payout.status] || "bg-gray-100"}`}>
                    {payout.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaWallet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Automatic Payouts</h4>
            <p className="text-xs text-blue-700 mt-1">
              When a traveler confirms tour completion, escrow is released and your net payout is sent
              automatically to your default verified payout account. Platform commission is deducted once
              at release — never twice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
