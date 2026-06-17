"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaEye, FaExclamationTriangle, FaClock } from "react-icons/fa";
import { adminApi } from "@/lib/api";

interface PendingGuide {
  id: string;
  userId: string;
  slug: string;
  bio: string;
  languages: string[];
  specialities: string[];
  experience: number;
  pricePerDay: number;
  location: string;
  isVerified: boolean;
  createdAt: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: string;
  };
}

export default function GuideApprovalPage() {
  const [guides, setGuides] = useState<PendingGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<PendingGuide | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchPendingGuides();
  }, []);

  const fetchPendingGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPendingGuides();
      const result = response.data;
      if (result.success && result.data) {
        setGuides(result.data);
      } else {
        setGuides([]);
      }
    } catch (err: any) {
      console.error("Error fetching pending guides:", err);
      setError(err.response?.data?.message || "Failed to load pending guides");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (guideId: string) => {
    setActionLoading(guideId);
    setError(null);
    try {
      const response = await adminApi.approveGuide(guideId);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Guide approved successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchPendingGuides();
      } else {
        setError(result.message || "Failed to approve guide");
      }
    } catch (err: any) {
      console.error("Error approving guide:", err);
      setError(err.response?.data?.message || "Failed to approve guide");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedGuide) return;
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setActionLoading(selectedGuide.id);
    setError(null);
    try {
      const response = await adminApi.rejectGuide(selectedGuide.id, rejectReason);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Guide rejected successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowRejectModal(false);
        setSelectedGuide(null);
        setRejectReason("");
        fetchPendingGuides();
      } else {
        setError(result.message || "Failed to reject guide");
      }
    } catch (err: any) {
      console.error("Error rejecting guide:", err);
      setError(err.response?.data?.message || "Failed to reject guide");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><FaCheckCircle className="w-3 h-3" /> Verified</span>;
    }
    return <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full"><FaClock className="w-3 h-3" /> Pending</span>;
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-48 sm:w-56 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-64 sm:w-80 mt-2 animate-pulse"></div>
        </div>
        
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-32 mb-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Guide Approval</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Review and approve guide applications ({guides.length} pending)
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

      {/* Guides List */}
      {guides.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">No pending approvals</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            All guides have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {guides.map((guide) => (
            <div key={guide.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Guide Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {guide.users?.firstName} {guide.users?.lastName}
                    </h3>
                    {getStatusBadge(guide.isVerified)}
                  </div>
                  
                  <div className="space-y-1 text-xs sm:text-sm text-gray-500">
                    <p>Email: {guide.users?.email}</p>
                    <p>Phone: {guide.users?.phone || "Not provided"}</p>
                    <p>Location: {guide.location || "Not specified"}</p>
                    <p>Experience: {guide.experience} years</p>
                    <p>Price Per Day: Rs {guide.pricePerDay?.toLocaleString() || 0}</p>
                    <p>Languages: {guide.languages?.join(", ") || "None"}</p>
                    <p>Specialities: {guide.specialities?.join(", ") || "None"}</p>
                    <p className="text-gray-700 mt-2">{guide.bio?.substring(0, 200)}...</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied: {new Date(guide.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2">
                  <button
                    onClick={() => window.open(`/guide/${guide.slug}`, "_blank")}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1"
                  >
                    <FaEye className="w-3 h-3" /> View Profile
                  </button>
                  <button
                    onClick={() => handleApprove(guide.id)}
                    disabled={actionLoading === guide.id}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === guide.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGuide(guide);
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading === guide.id}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    <FaTimesCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Reject Guide Application</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-3">
                Rejecting <strong>{selectedGuide.users?.firstName} {selectedGuide.users?.lastName}</strong>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why the application is being rejected..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === selectedGuide.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedGuide.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaTimesCircle className="w-4 h-4" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}