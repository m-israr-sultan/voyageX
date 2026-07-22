"use client";

import { useEffect, useState } from "react";
import {
  FaSpinner,
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaRedo,
  FaMobileAlt,
  FaUniversity,
  FaWallet,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";

type Tab = "payouts" | "accounts" | "retry";

interface PayoutRecord {
  id: string;
  status: string;
  provider: string;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  voyagexReference: string;
  providerReference?: string | null;
  failureReason?: string | null;
  retryCount: number;
  createdAt: string;
  completedAt?: string | null;
  failedAt?: string | null;
  guides?: {
    users?: { firstName?: string; lastName?: string; email?: string };
  };
  bookings?: { id: string; startDate?: string; endDate?: string; totalPrice?: number };
  payments?: { id: string; transactionId?: string | null };
}

interface PayoutAccount {
  id: string;
  provider: string;
  accountTitle: string;
  mobileNumber?: string | null;
  iban?: string | null;
  bankName?: string | null;
  accountStatus: string;
  createdAt: string;
  guides?: {
    users?: { firstName?: string; lastName?: string; email?: string };
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PROCESSING: "bg-blue-50 text-blue-700",
  SUCCESS: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
};

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("payouts");
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [retryQueue, setRetryQueue] = useState<PayoutRecord[]>([]);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<PayoutAccount | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.listPayouts({
        status: statusFilter || undefined,
        search: search || undefined,
        page,
        limit: 25,
      });
      const result = response.data;
      if (result.success) {
        const data = result.data;
        setPayouts(data?.payouts || []);
        setRetryQueue(data?.retryQueue || []);
        setTotalPages(data?.pagination?.totalPages || 1);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPendingPayoutAccounts();
      const result = response.data;
      if (result.success) {
        setAccounts(result.data || []);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Failed to load payout accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "accounts") {
      fetchAccounts();
    } else {
      fetchPayouts();
    }
  }, [activeTab, statusFilter, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPayouts();
  };

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.retryPayout(id);
      setSuccess("Payout retry initiated.");
      await fetchPayouts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Retry failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAccount = async (id: string) => {
    setActionLoading(id);
    try {
      await adminApi.approvePayoutAccount(id);
      setSuccess("Payout account approved.");
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectAccount = async (id: string) => {
    if (!rejectReason.trim()) {
      setError("Rejection reason is required");
      return;
    }
    setActionLoading(id);
    try {
      await adminApi.rejectPayoutAccount(id, rejectReason.trim());
      setSuccess("Payout account rejected.");
      setSelectedAccount(null);
      setRejectReason("");
      await fetchAccounts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  const guideName = (record: { guides?: { users?: { firstName?: string; lastName?: string; email?: string } } }) => {
    const user = record.guides?.users;
    if (!user) return "—";
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return name || user.email || "—";
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Guide Payouts</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Monitor automatic payouts, retry failures, and verify payout destinations
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["payouts", "retry", "accounts"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-lg capitalize ${
              activeTab === tab
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab === "retry" ? `Retry Queue (${retryQueue.length})` : tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <FaExclamationTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <FaCheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FaSpinner className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : activeTab === "accounts" ? (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <FaWallet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No accounts pending verification</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{guideName(account)}</p>
                    <p className="text-sm text-gray-500">{account.guides?.users?.email}</p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      {account.provider === "BANK_ACCOUNT" ? (
                        <FaUniversity className="text-blue-600" />
                      ) : (
                        <FaMobileAlt className="text-green-600" />
                      )}
                      <span>{account.provider.replace(/_/g, " ")} — {account.accountTitle}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 space-y-0.5">
                      {account.mobileNumber && <p>Mobile: {account.mobileNumber}</p>}
                      {account.iban && <p>IBAN: {account.iban}</p>}
                      {account.bankName && <p>Bank: {account.bankName}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveAccount(account.id)}
                      disabled={actionLoading === account.id}
                      className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedAccount(account)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          {activeTab === "payouts" && (
            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search reference, guide email..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg">
                  Search
                </button>
              </form>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="SUCCESS">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Guide</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Provider</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Gross</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Commission</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Net</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "retry" ? retryQueue : payouts).length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        No payouts found
                      </td>
                    </tr>
                  ) : (
                    (activeTab === "retry" ? retryQueue : payouts).map((payout) => (
                      <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{payout.voyagexReference}</p>
                          {payout.providerReference && (
                            <p className="text-xs text-gray-400">{payout.providerReference}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p>{guideName(payout)}</p>
                          <p className="text-xs text-gray-400">{payout.bookings?.id?.slice(0, 8)}...</p>
                        </td>
                        <td className="px-4 py-3">{payout.provider.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-right">Rs {payout.grossAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-red-600">
                          - Rs {payout.commissionAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-green-600">
                          Rs {payout.netAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[payout.status] || "bg-gray-100"}`}>
                            {payout.status}
                          </span>
                          {payout.failureReason && (
                            <p className="text-xs text-red-500 mt-1 max-w-[160px] truncate" title={payout.failureReason}>
                              {payout.failureReason}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {payout.status === "FAILED" && (
                            <button
                              onClick={() => handleRetry(payout.id)}
                              disabled={actionLoading === payout.id}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                            >
                              <FaRedo className="w-3 h-3" />
                              Retry ({payout.retryCount})
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {activeTab === "payouts" && totalPages > 1 && (
            <div className="flex justify-center gap-2">
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
        </>
      )}

      {selectedAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900">Reject Payout Account</h3>
            <p className="text-sm text-gray-500 mt-1">
              {guideName(selectedAccount)} — {selectedAccount.accountTitle}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              className="w-full mt-4 border border-gray-200 rounded-lg px-3 py-2 text-sm h-24"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleRejectAccount(selectedAccount.id)}
                disabled={actionLoading === selectedAccount.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => { setSelectedAccount(null); setRejectReason(""); }}
                className="flex-1 px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
