"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye, 
  FaExclamationTriangle, 
  FaClock,
  FaBuilding,
  FaMapMarkerAlt,
  FaGlobe,
  FaPhone,
  FaEnvelope,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";

interface PendingAgency {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
  city: string;
  country: string;
  website: string;
  address: string;
  isVerified: boolean;
  createdAt: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    avatar: string;
  };
  documents?: Array<{
    id: string;
    type: string;
    fileUrl: string;
    status: string;
  }>;
}

export default function AgencyApprovalPage() {
  const [agencies, setAgencies] = useState<PendingAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAgency, setSelectedAgency] = useState<PendingAgency | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  useEffect(() => {
    fetchPendingAgencies();
  }, []);

  const fetchPendingAgencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getPendingAgencies();
      const result = response.data;
      if (result.success && result.data) {
        setAgencies(result.data);
      } else {
        setAgencies([]);
      }
    } catch (err: any) {
      console.error("Error fetching pending agencies:", err);
      setError(err.response?.data?.message || "Failed to load pending agencies");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agencyId: string) => {
    setActionLoading(agencyId);
    setError(null);
    try {
      const response = await adminApi.approveAgencyDocuments(agencyId);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Agency documents approved successfully! Free trial started.");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchPendingAgencies();
      } else {
        setError(result.message || "Failed to approve agency");
      }
    } catch (err: any) {
      console.error("Error approving agency:", err);
      setError(err.response?.data?.message || "Failed to approve agency");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedAgency) return;
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    setActionLoading(selectedAgency.id);
    setError(null);
    try {
      const response = await adminApi.rejectAgencyDocuments(selectedAgency.id, rejectReason);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Agency documents rejected successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowRejectModal(false);
        setSelectedAgency(null);
        setRejectReason("");
        fetchPendingAgencies();
      } else {
        setError(result.message || "Failed to reject agency");
      }
    } catch (err: any) {
      console.error("Error rejecting agency:", err);
      setError(err.response?.data?.message || "Failed to reject agency");
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
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-56 sm:w-64 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-72 sm:w-96 mt-2 animate-pulse"></div>
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agency Approval</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Review and approve agency document submissions ({agencies.length} pending)
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

      {/* Agencies List */}
      {agencies.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">No pending approvals</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            All agencies have been reviewed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agencies.map((agency) => (
            <div key={agency.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Agency Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {agency.name}
                    </h3>
                    {getStatusBadge(agency.isVerified)}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
                    <p className="flex items-center gap-1"><FaBuilding className="w-3 h-3" /> Owner: {agency.users?.firstName} {agency.users?.lastName}</p>
                    <p className="flex items-center gap-1"><FaEnvelope className="w-3 h-3" /> {agency.users?.email}</p>
                    <p className="flex items-center gap-1"><FaPhone className="w-3 h-3" /> {agency.users?.phone || "Not provided"}</p>
                    <p className="flex items-center gap-1"><FaMapMarkerAlt className="w-3 h-3" /> {agency.city}, {agency.country}</p>
                    {agency.website && <p className="flex items-center gap-1"><FaGlobe className="w-3 h-3" /> <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{agency.website}</a></p>}
                  </div>
                  
                  {agency.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{agency.description}</p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-2">
                    Applied: {new Date(agency.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2">
                  <button
                    onClick={() => {
                      setSelectedAgency(agency);
                      setShowDocsModal(true);
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 flex items-center gap-1"
                  >
                    <FaEye className="w-3 h-3" /> View Documents
                  </button>
                  <button
                    onClick={() => handleApprove(agency.id)}
                    disabled={actionLoading === agency.id}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === agency.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAgency(agency);
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading === agency.id}
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
      {showRejectModal && selectedAgency && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Reject Agency Application</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-3">
                Rejecting <strong>{selectedAgency.name}</strong>
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why the documents are being rejected..."
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
                  disabled={actionLoading === selectedAgency.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading === selectedAgency.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaTimesCircle className="w-4 h-4" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocsModal && selectedAgency && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-semibold text-gray-900">Documents - {selectedAgency.name}</h3>
              <button onClick={() => setShowDocsModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">Owner Information</p>
                  <p className="text-xs text-gray-600 mt-1">Name: {selectedAgency.users?.firstName} {selectedAgency.users?.lastName}</p>
                  <p className="text-xs text-gray-600">Email: {selectedAgency.users?.email}</p>
                  <p className="text-xs text-gray-600">Phone: {selectedAgency.users?.phone || "Not provided"}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700">Agency Details</p>
                  <p className="text-xs text-gray-600 mt-1">Name: {selectedAgency.name}</p>
                  <p className="text-xs text-gray-600">Address: {selectedAgency.address || "Not provided"}</p>
                  <p className="text-xs text-gray-600">City: {selectedAgency.city}</p>
                  <p className="text-xs text-gray-600">Country: {selectedAgency.country}</p>
                  {selectedAgency.website && <p className="text-xs text-gray-600">Website: {selectedAgency.website}</p>}
                </div>

                {selectedAgency.description && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-xs text-gray-600 mt-1">{selectedAgency.description}</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-3 border-t">
                <button
                  onClick={() => window.open(`/agency/${selectedAgency.slug}`, "_blank")}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  View Public Profile
                </button>
                <button
                  onClick={() => setShowDocsModal(false)}
                  className="flex-1 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}