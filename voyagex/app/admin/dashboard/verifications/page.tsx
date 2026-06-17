"use client";

import { useState, useEffect } from "react";
import {
  FaSpinner, FaCheckCircle, FaTimesCircle,
  FaSearch, FaFileAlt, FaEye, FaTimes,
} from "react-icons/fa";
import { verificationsApi } from "@/lib/api";

export default function AdminVerificationsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "GUIDE" | "AGENCY" | "TRAVELER">("ALL");
  const [search, setSearch] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await verificationsApi.getPendingVerifications();
      const result = response.data;
      if (result.success && result.data) {
        const docs = result.data || [];
        setDocuments(Array.isArray(docs) ? docs : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load documents");
    } finally { setLoading(false); }
  };

  const handleApprove = async (docId: string) => {
    setActionLoading(docId);
    try {
      await verificationsApi.updateDocumentStatus(docId, "APPROVED");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      fetchDocuments();
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (docId: string) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason before rejecting a document.");
      return;
    }
    setActionLoading(docId);
    try {
      await verificationsApi.updateDocumentStatus(docId, "REJECTED", rejectionReason.trim());
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setRejectionReason("");
      setSelectedDoc(null);
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject document");
    }
    finally { setActionLoading(null); }
  };

  const filteredDocs = documents.filter((doc) => {
    const role = doc.users?.role;
    const matchesFilter = filter === "ALL" || role === filter;
    const name = `${doc.users?.firstName || ""} ${doc.users?.lastName || ""}`.toLowerCase();
    const matchesSearch = !search || name.includes(search.toLowerCase()) || doc.users?.email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      CNIC_FRONT: "CNIC Front",
      CNIC_BACK: "CNIC Back",
      RECOMMENDATION_LETTER: "Recommendation Letter",
      NOC: "NOC",
      CERTIFICATE: "Certificate",
    };
    return labels[type] || type;
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      GUIDE: "bg-blue-50 text-blue-700 border-blue-200",
      AGENCY: "bg-purple-50 text-purple-700 border-purple-200",
      TRAVELER: "bg-green-50 text-green-700 border-green-200",
    };
    return `px-2 py-0.5 rounded text-xs font-medium border ${styles[role] || "bg-gray-50 text-gray-600 border-gray-200"}`;
  };

  // Count documents per user to show verification progress
  const docsByUser = documents.reduce((acc: Record<string, any[]>, doc) => {
    const userId = doc.userId;
    if (!acc[userId]) acc[userId] = [];
    acc[userId].push(doc);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="ml-2.5 text-sm text-gray-500">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Document Verification</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {documents.length} pending documents from {Object.keys(docsByUser).length} users
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>
        <div className="flex gap-2">
          {["ALL", "GUIDE", "AGENCY"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "ALL" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-12">
            <FaFileAlt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No pending documents</p>
            <p className="text-xs text-gray-400 mt-1">Guides and agencies must upload documents from their panel</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-lg flex-shrink-0">
                      📎
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900">
                          {getDocumentTypeLabel(doc.type)}
                        </span>
                        <span className={getRoleBadge(doc.users?.role)}>
                          {doc.users?.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {doc.users?.firstName} {doc.users?.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{doc.users?.email}</p>
                      {doc.fileName && (
                        <p className="text-xs text-gray-400 mt-0.5">📎 {doc.fileName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <FaEye className="w-3 h-3" /> View Document
                    </button>
                    <button
                      onClick={() => handleApprove(doc.id)}
                      disabled={actionLoading === doc.id}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === doc.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">
                  {getDocumentTypeLabel(selectedDoc.type)}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedDoc.users?.firstName} {selectedDoc.users?.lastName} ({selectedDoc.users?.role})
                </p>
              </div>
              <button
                onClick={() => { setSelectedDoc(null); setRejectionReason(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {/* Document Image */}
              <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden mb-4">
                {selectedDoc.fileUrl ? (
                  <img
                    src={selectedDoc.fileUrl}
                    alt={getDocumentTypeLabel(selectedDoc.type)}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <FaFileAlt className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium">{getDocumentTypeLabel(selectedDoc.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">File</span>
                  <span className="font-medium text-xs">{selectedDoc.fileName || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded</span>
                  <span className="font-medium text-xs">
                    {new Date(selectedDoc.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">User</span>
                  <span className="font-medium text-xs">
                    {selectedDoc.users?.firstName} {selectedDoc.users?.lastName}
                  </span>
                </div>
              </div>

              {/* Reject Reason */}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Rejection Reason (required for reject)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why this document is being rejected..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleApprove(selectedDoc.id);
                    setSelectedDoc(null);
                  }}
                  disabled={actionLoading === selectedDoc.id}
                  className="flex-1 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <FaCheckCircle className="w-3 h-3" /> Approve Document
                </button>
                <button
                  onClick={() => {
                    handleReject(selectedDoc.id);
                    setSelectedDoc(null);
                  }}
                  disabled={actionLoading === selectedDoc.id || !rejectionReason.trim()}
                  className="flex-1 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <FaTimesCircle className="w-3 h-3" /> Reject Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}