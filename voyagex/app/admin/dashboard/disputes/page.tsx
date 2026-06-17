"use client";

import { useState, useEffect } from "react";
import {
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaGavel,
  FaEye,
  FaUser,
  FaCalendarAlt,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  bookingId: string;
  raisedBy: string;
  adminNote?: string;
  bookings?: {
    id: string;
    totalPrice: number;
    startDate: string;
    endDate: string;
    users?: { firstName: string; lastName: string; email: string };
    packages?: { title: string };
  };
  users?: { firstName: string; lastName: string; email: string };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveDecision, setResolveDecision] = useState("GUIDE_WINS");
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getDisputes();
      const result = response.data;
      if (result.success && result.data) {
        setDisputes(result.data);
      } else {
        setDisputes([]);
      }
    } catch (err: any) {
      console.error("Error fetching disputes:", err);
      setError(err.response?.data?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    setActionLoading(true);
    try {
      const response = await adminApi.resolveDispute(selectedDispute.bookingId, {
        decision: resolveDecision,
        adminNote,
      });
      const result = response.data;
      if (result.success || result.data) {
        setSuccessMessage(`Dispute resolved: ${resolveDecision}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowResolveModal(false);
        setSelectedDispute(null);
        setResolveDecision("GUIDE_WINS");
        setAdminNote("");
        fetchDisputes();
      } else {
        setError(result.message || "Failed to resolve dispute");
      }
    } catch (err: any) {
      console.error("Error resolving dispute:", err);
      setError(err.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: "bg-yellow-100 text-yellow-700",
      UNDER_REVIEW: "bg-blue-100 text-blue-700",
      RESOLVED_GUIDE_WINS: "bg-green-100 text-green-700",
      RESOLVED_TRAVELER_WINS: "bg-red-100 text-red-700",
      RESOLVED_PARTIAL: "bg-orange-100 text-orange-700",
    };
    const icons: Record<string, any> = {
      OPEN: FaClock,
      UNDER_REVIEW: FaEye,
      RESOLVED_GUIDE_WINS: FaCheckCircle,
      RESOLVED_TRAVELER_WINS: FaTimesCircle,
      RESOLVED_PARTIAL: FaExclamationTriangle,
    };
    const Icon = icons[status] || FaExclamationTriangle;
    const displayStatus = status.replace(/_/g, " ");
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || "bg-gray-100"}`}>
        <Icon className="w-3 h-3" /> {displayStatus}
      </span>
    );
  };

  const filteredDisputes =
    statusFilter === "ALL"
      ? disputes
      : disputes.filter((d) => d.status === statusFilter);

  const stats = {
    total: disputes.length,
    open: disputes.filter((d) => d.status === "OPEN").length,
    underReview: disputes.filter((d) => d.status === "UNDER_REVIEW").length,
    resolved: disputes.filter((d) => d.status?.startsWith("RESOLVED")).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Disputes Management</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Review and resolve traveler disputes
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Disputes", count: stats.total, color: "bg-gray-50" },
          { label: "Open", count: stats.open, color: "bg-yellow-50" },
          { label: "Under Review", count: stats.underReview, color: "bg-blue-50" },
          { label: "Resolved", count: stats.resolved, color: "bg-green-50" },
        ].map((item) => (
          <div
            key={item.label}
            className={`${item.color} rounded-lg border p-3 text-center`}
          >
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{item.count}</p>
            <p className="text-xs text-gray-600">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {["ALL", "OPEN", "UNDER_REVIEW", "RESOLVED"].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === filter
                ? "bg-[#008A1E] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filter === "ALL" ? "All" : filter.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-3">
        {filteredDisputes.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
            <FaGavel className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-medium text-gray-700">No disputes found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              All disputes have been resolved
            </p>
          </div>
        ) : (
          filteredDisputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      Booking: {dispute.bookings?.packages?.title || "Tour Package"}
                    </h3>
                    {getStatusBadge(dispute.status)}
                  </div>

                  <div className="space-y-1 text-xs sm:text-sm text-gray-500">
                    <p className="flex items-center gap-1">
                      <FaUser className="w-3 h-3" />
                      Traveler: {dispute.users?.firstName} {dispute.users?.lastName} ({dispute.users?.email})
                    </p>
                    <p className="flex items-center gap-1">
                      <FaCalendarAlt className="w-3 h-3" />
                      {dispute.bookings?.startDate
                        ? `${new Date(dispute.bookings.startDate).toLocaleDateString()} - ${new Date(dispute.bookings.endDate).toLocaleDateString()}`
                        : "Date not available"}
                    </p>
                    <p className="font-medium text-gray-900">
                      Amount: Rs {dispute.bookings?.totalPrice?.toLocaleString() || "N/A"}
                    </p>
                    <p className="mt-2 text-gray-700">
                      <strong>Reason:</strong> {dispute.reason}
                    </p>
                    {dispute.description && (
                      <p className="text-gray-600 text-xs italic">
                        "{dispute.description}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Raised: {new Date(dispute.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowResolveModal(true);
                    }}
                    disabled={dispute.status?.startsWith("RESOLVED")}
                    className="px-3 py-1.5 bg-[#008A1E] text-white text-xs rounded-lg hover:bg-[#006816] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <FaGavel className="w-3 h-3" /> Resolve
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Resolve Dispute</h2>
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <FaTimesCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Reason:</strong> {selectedDispute.reason}
                </p>
                {selectedDispute.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Details:</strong> {selectedDispute.description}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  <strong>Amount:</strong> Rs {selectedDispute.bookings?.totalPrice?.toLocaleString()}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Decision *
                  </label>
                  <select
                    value={resolveDecision}
                    onChange={(e) => setResolveDecision(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  >
                    <option value="GUIDE_WINS">Guide Wins (Release Payment to Guide)</option>
                    <option value="TRAVELER_WINS">Traveler Wins (Refund to Traveler)</option>
                    <option value="PARTIAL">Partial Resolution (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Note
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows={3}
                    placeholder="Explain your decision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowResolveModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                    Confirm Resolution
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}