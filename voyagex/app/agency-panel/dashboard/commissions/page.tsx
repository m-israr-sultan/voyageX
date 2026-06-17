// Commission system planned for future phase.
// This page is not active. Do not link from sidebar.
// Payment method selector fix deferred to commission phase.
"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaClock,
  FaCalendarAlt,
  FaCreditCard,
  FaWallet,
  FaMobileAlt,
  FaDollarSign,
  FaEye,
  FaInfoCircle,
} from "react-icons/fa";
import { agenciesApi } from "@/lib/api";

interface Commission {
  id: string;
  bookingId: string;
  amount: number;
  dueDate: string;
  paidAt: string | null;
  status: string;
  bookings: {
    id: string;
    totalPrice: number;
    packages: {
      title: string;
    };
    users: {
      firstName: string;
      lastName: string;
      email: string;
    };
    startDate: string;
    endDate: string;
  };
}

export default function AgencyCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "paid">("pending");

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agenciesApi.getCommissionHistory();
      const result = response.data;
      if (result.success && result.data) {
        setCommissions(result.data);
      } else {
        setCommissions([]);
      }
    } catch (err: any) {
      console.error("Error fetching commissions:", err);
      setError(err.response?.data?.message || "Failed to load commission history");
    } finally {
      setLoading(false);
    }
  };

  const handlePayCommission = async () => {
    if (!selectedCommission) return;
    if (!transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    setPaymentLoading(selectedCommission.id);
    setError(null);
    try {
      const response = await agenciesApi.payCommission(selectedCommission.bookingId, {
        transactionId: transactionId,
      });
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Commission payment recorded successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowPaymentModal(false);
        setSelectedCommission(null);
        setTransactionId("");
        fetchCommissions();
      } else {
        setError(result.message || "Failed to record payment");
      }
    } catch (err: any) {
      console.error("Error paying commission:", err);
      setError(err.response?.data?.message || "Failed to record payment");
    } finally {
      setPaymentLoading(null);
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    if (status === "PAID") {
      return <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FaCheckCircle className="w-3 h-3" /> Paid</span>;
    }
    if (dueDate) {
      const daysOverdue = getDaysOverdue(dueDate);
      if (daysOverdue > 15) {
        return <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><FaExclamationTriangle className="w-3 h-3" /> Overdue ({daysOverdue} days)</span>;
      }
      if (daysOverdue > 0) {
        return <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><FaClock className="w-3 h-3" /> Due ({daysOverdue} days overdue)</span>;
      }
      const daysRemaining = Math.abs(daysOverdue);
      if (daysRemaining <= 3) {
        return <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><FaClock className="w-3 h-3" /> Due Soon ({daysRemaining} days)</span>;
      }
    }
    return <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><FaClock className="w-3 h-3" /> Pending</span>;
  };

  const pendingCommissions = commissions.filter(c => c.status === "PENDING");
  const paidCommissions = commissions.filter(c => c.status === "PAID");
  const totalPendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
  const overdueCount = pendingCommissions.filter(c => getDaysOverdue(c.dueDate) > 0).length;

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-40 sm:w-48 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="border-b border-gray-200">
          <div className="flex gap-4">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 space-y-3">
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Commissions</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Track and pay your agency commission fees
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center mb-2">
            <FaClock className="w-4 h-4 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{pendingCommissions.length}</h3>
          <p className="text-xs text-gray-500">Pending Commissions</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mb-2">
            <FaExclamationTriangle className="w-4 h-4 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{overdueCount}</h3>
          <p className="text-xs text-gray-500">Overdue</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-2">
            <FaDollarSign className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Rs {totalPendingAmount.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Total Pending</p>
        </div>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "text-[#008A1E] border-b-2 border-[#008A1E]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending ({pendingCommissions.length})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`pb-2 text-sm font-medium transition-colors ${
              activeTab === "paid"
                ? "text-[#008A1E] border-b-2 border-[#008A1E]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Paid ({paidCommissions.length})
          </button>
        </div>
      </div>

      {/* Pending Commissions List */}
      {activeTab === "pending" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {pendingCommissions.length === 0 ? (
            <div className="p-8 text-center">
              <FaCheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No pending commissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Traveler</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Booking Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Commission (5%)</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{commission.bookings?.packages?.title || "N/A"}</p>
                        <p className="text-xs text-gray-400">{new Date(commission.bookings?.startDate).toLocaleDateString()} - {new Date(commission.bookings?.endDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-700">{commission.bookings?.users?.firstName} {commission.bookings?.users?.lastName}</p>
                        <p className="text-xs text-gray-400">{commission.bookings?.users?.email}</p>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        Rs {commission.bookings?.totalPrice?.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-orange-600">Rs {commission.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {new Date(commission.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3">
                        {getStatusBadge(commission.status, commission.dueDate)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedCommission(commission);
                            setShowPaymentModal(true);
                          }}
                          className="px-3 py-1.5 bg-[#008A1E] text-white rounded-lg text-xs font-medium hover:bg-[#006816]"
                        >
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Paid Commissions List */}
      {activeTab === "paid" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {paidCommissions.length === 0 ? (
            <div className="p-8 text-center">
              <FaDollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No paid commissions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paidCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{commission.bookings?.packages?.title || "N/A"}</p>
                        <p className="text-xs text-gray-400">{new Date(commission.bookings?.startDate).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-green-600">Rs {commission.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {commission.paidAt ? new Date(commission.paidAt).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-5 py-3">
                        {getStatusBadge("PAID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCommission && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Pay Commission</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">{selectedCommission.bookings?.packages?.title}</p>
                <p className="text-xs text-gray-500">Traveler: {selectedCommission.bookings?.users?.firstName} {selectedCommission.bookings?.users?.lastName}</p>
                <p className="text-xs text-orange-600 mt-1">Commission Amount: Rs {selectedCommission.amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Due Date: {new Date(selectedCommission.dueDate).toLocaleDateString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  defaultValue="BANK_TRANSFER"
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction reference"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                />
              </div>

              <div className="bg-yellow-50 rounded-lg p-3">
                <p className="text-xs text-yellow-700">
                  <strong>Payment Instructions:</strong> Please transfer Rs {selectedCommission.amount.toLocaleString()} to the following account and enter the transaction ID above.
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <p>Bank: [Your Bank Name]</p>
                  <p>Account: [Your Account Number]</p>
                  <p>Title: VoyageX Tourism</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayCommission}
                  disabled={paymentLoading === selectedCommission.id}
                  className="flex-1 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paymentLoading === selectedCommission.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5"/>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">About Commission</h4>
            <p className="text-xs text-blue-700 mt-1">
              VoyageX charges a 5% commission on each booking made through your agency. 
              Commission is due within 7 days after tour completion. Late payments may result in 
              temporary delisting from search results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}