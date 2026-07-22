"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaClock,
  FaBuilding,
  FaCalendarAlt,
  FaCreditCard,
  FaWallet,
  FaMobileAlt,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

interface ExpiringAgency {
  id: string;
  name: string;
  email: string;
  freePeriodEndsAt: string;
  subscriptionStatus: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SubscriptionRecord {
  id: string;
  agencyId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  transactionId: string;
  periodStart: string;
  periodEnd: string;
  agencies: {
    name: string;
    users: {
      email: string;
    };
  };
}

export default function SubscriptionsPage() {
  const [expiringAgencies, setExpiringAgencies] = useState<ExpiringAgency[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionRecord[]>([]);
  const [pendingProofs, setPendingProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<ExpiringAgency | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  // Subscription amount is always Rs 10,000 — from PLATFORM_CONFIG.agencySubscriptionAmount
  // Never change this value. Never hardcode any other amount.
  const SUBSCRIPTION_AMOUNT = 10_000;

  const [paymentDetails, setPaymentDetails] = useState({
    paymentMethod: "BANK_TRANSFER",
    transactionId: "",
    periodMonths: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expiringRes, historyRes, pendingRes] = await Promise.all([
        adminApi.getExpiringSubscriptions(),
        adminApi.getSubscriptionHistory(),
        adminApi.getPendingSubscriptionProofs(),
      ]);

      if (expiringRes.data?.success) setExpiringAgencies(expiringRes.data.data || []);
      if (historyRes.data?.success) setSubscriptionHistory(historyRes.data.data || []);
      // pending proofs can be a direct array or wrapped in .data
      const proofData = pendingRes.data?.data ?? pendingRes.data ?? [];
      setPendingProofs(Array.isArray(proofData) ? proofData : []);
    } catch (err: any) {
      console.error("Error fetching subscription data:", err);
      setError(err.response?.data?.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveProof = async (paymentId: string) => {
    setActionLoading(paymentId);
    setError(null);
    try {
      await adminApi.approveSubscriptionPayment(paymentId);
      setSuccessMessage("Subscription proof approved. Agency subscription activated.");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve proof");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProof = async (paymentId: string) => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setActionLoading(paymentId);
    setError(null);
    try {
      await adminApi.rejectSubscriptionPayment(paymentId, rejectReason.trim());
      setSuccessMessage("Subscription proof rejected. Agency has been notified.");
      setTimeout(() => setSuccessMessage(null), 3000);
      setRejectReason("");
      setRejectingId(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject proof");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedAgency) return;
    if (!paymentDetails.transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    setActionLoading(selectedAgency.id);
    setError(null);
    try {
      const response = await adminApi.recordSubscriptionPayment(selectedAgency.id, {
        // Amount is always SUBSCRIPTION_AMOUNT (Rs 10,000) — never submitted by admin input
        paymentMethod: paymentDetails.paymentMethod,
        transactionId: paymentDetails.transactionId,
        periodMonths: paymentDetails.periodMonths,
      });
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Subscription payment recorded successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowPaymentModal(false);
        setSelectedAgency(null);
        setPaymentDetails({
          paymentMethod: "BANK_TRANSFER",
          transactionId: "",
          periodMonths: 1,
        });
        fetchData();
      } else {
        setError(result.message || "Failed to record payment");
      }
    } catch (err: any) {
      console.error("Error recording payment:", err);
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setActionLoading(null);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, endDate?: string) => {
    if (status === "ACTIVE") {
      return <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FaCheckCircle className="w-3 h-3" /> Active</span>;
    }
    if (status === "FREE_TRIAL" && endDate) {
      const daysLeft = getDaysRemaining(endDate);
      if (daysLeft <= 3) {
        return <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><FaExclamationTriangle className="w-3 h-3" /> Expiring Soon ({daysLeft} days)</span>;
      }
      return <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><FaClock className="w-3 h-3" /> Free Trial ({daysLeft} days left)</span>;
    }
    if (status === "EXPIRED") {
      return <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><FaTimesCircle className="w-3 h-3" /> Expired</span>;
    }
    return <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full">{status}</span>;
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "EASYPAISA": return <FaMobileAlt className="w-3 h-3" />;
      case "JAZZCASH": return <FaMobileAlt className="w-3 h-3" />;
      case "BANK_TRANSFER": return <FaWallet className="w-3 h-3" />;
      default: return <FaCreditCard className="w-3 h-3" />;
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-40 sm:w-48 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-64 sm:w-80 mt-2 animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage agency subscriptions and track payments
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          <FaCheckCircle className="inline w-4 h-4 mr-1" /> {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <FaExclamationTriangle className="inline w-4 h-4 mr-1" /> {error}
        </div>
      )}

      {/* Pending Subscription Proofs */}
      {pendingProofs.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-amber-100 bg-amber-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-amber-500" />
                Pending Payment Proofs ({pendingProofs.length})
              </h2>
              <p className="text-xs text-amber-700 mt-0.5">Agency subscription payments awaiting admin review</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingProofs.map((proof) => (
              <div key={proof.id} className="px-5 py-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900">{proof.agencies?.name || "Unknown Agency"}</p>
                    <p className="text-xs text-gray-500">{proof.agencies?.users?.email}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Amount: PKR {proof.amount?.toLocaleString()}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Method: {proof.paymentMethod}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded">Tx: {proof.transactionId}</span>
                    </div>
                    {proof.proofUrl && (
                      <a href={getImageUrl(proof.proofUrl)} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View Proof Document →
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-[160px]">
                    {rejectingId === proof.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason…"
                          rows={2}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectProof(proof.id)}
                            disabled={actionLoading === proof.id}
                            className="flex-1 text-xs bg-red-600 text-white px-2 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            {actionLoading === proof.id ? <FaSpinner className="animate-spin inline w-3 h-3" /> : "Confirm Reject"}
                          </button>
                          <button onClick={() => { setRejectingId(null); setRejectReason(""); }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveProof(proof.id)}
                          disabled={actionLoading === proof.id}
                          className="flex-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          {actionLoading === proof.id ? <FaSpinner className="animate-spin w-3 h-3" /> : <FaCheckCircle className="w-3 h-3" />}
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectingId(proof.id)}
                          className="flex-1 text-xs bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded hover:bg-red-50 flex items-center justify-center gap-1"
                        >
                          <FaTimesCircle className="w-3 h-3" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expiring Subscriptions Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-900">Agencies Needing Attention</h2>
          <p className="text-xs text-gray-500 mt-0.5">Free trials ending within 3 days</p>
        </div>
        
        {expiringAgencies.length === 0 ? (
          <div className="p-8 text-center">
            <FaCheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No expiring subscriptions</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {expiringAgencies.map((agency) => (
              <div key={agency.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{agency.name}</p>
                  <p className="text-xs text-gray-500">{agency.users?.email}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Free trial ends: {new Date(agency.freePeriodEndsAt).toLocaleDateString()} ({getDaysRemaining(agency.freePeriodEndsAt)} days left)
                  </p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(agency.subscriptionStatus, agency.freePeriodEndsAt)}
                  <button
                    onClick={() => {
                      setSelectedAgency(agency);
                      setShowPaymentModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#008A1E] text-white rounded-lg text-xs font-medium hover:bg-[#006816]"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription History */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-900">Subscription History</h2>
          <p className="text-xs text-gray-500 mt-0.5">Recent subscription payments</p>
        </div>
        
        {subscriptionHistory.length === 0 ? (
          <div className="p-8 text-center">
            <FaCalendarAlt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No subscription payments recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Agency</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscriptionHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm text-gray-900">{record.agencies?.name}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">Rs {record.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {new Date(record.periodStart).toLocaleDateString()} - {new Date(record.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        {getPaymentMethodIcon(record.paymentMethod)} {record.paymentMethod}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{record.transactionId}</td>
                    <td className="px-5 py-3 text-xs text-gray-500">{new Date(record.paymentDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedAgency && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Record Subscription Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{selectedAgency.name}</p>
                <p className="text-xs text-gray-500">{selectedAgency.users?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
                {/* Amount is always Rs 10,000 — from PLATFORM_CONFIG.agencySubscriptionAmount. Not editable. */}
                <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 font-semibold text-gray-900">
                  Rs {SUBSCRIPTION_AMOUNT.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentDetails.paymentMethod}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                >
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={paymentDetails.transactionId}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                  placeholder="Enter transaction reference"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Period (Months)</label>
                <select
                  value={paymentDetails.periodMonths}
                  onChange={(e) => setPaymentDetails({ ...paymentDetails, periodMonths: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                >
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={actionLoading === selectedAgency.id}
                  className="flex-1 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedAgency.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}