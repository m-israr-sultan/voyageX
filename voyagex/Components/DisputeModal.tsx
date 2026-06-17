"use client";

import { useState } from "react";
import { FaTimes, FaGavel, FaSpinner } from "react-icons/fa";
import { bookingsApi } from "@/lib/api";

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onSuccess: () => void;
}

export default function DisputeModal({ isOpen, onClose, bookingId, onSuccess }: DisputeModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please select a reason");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await bookingsApi.raiseDispute(bookingId, { reason, description });
      const result = response.data;
      if (result.success || result.data) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || "Failed to raise dispute");
      }
    } catch (err: any) {
      console.error("Error raising dispute:", err);
      setError(err.response?.data?.message || "Failed to raise dispute. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const disputeReasons = [
    "Guide did not show up",
    "Service not as described",
    "Safety concerns",
    "Communication issues",
    "Cancellation without notice",
    "Other",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaGavel className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Raise a Dispute</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Please explain why you are disputing this booking. Our team will review your case within
            24-48 hours.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Dispute *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                required
              >
                <option value="">Select a reason</option>
                {disputeReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Please provide more details about your issue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] resize-none"
              />
            </div>

            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Note:</strong> Once you raise a dispute, the payment will be frozen until an
                admin resolves the issue. This process typically takes 24-48 hours.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaGavel className="w-4 h-4" />}
                Submit Dispute
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}