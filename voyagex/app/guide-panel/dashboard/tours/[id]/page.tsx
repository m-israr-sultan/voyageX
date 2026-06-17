"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSpinner,
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaMoneyBillWave,
  FaClock,
  FaFlagCheckered,
  FaPlay,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { bookingsApi } from "@/lib/api";

export default function GuideTourDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBooking();
  }, [params.id]);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.getById(params.id as string);
      const result = response.data;
      if (result.success && result.data) {
        setBooking(result.data);
      } else {
        setError("Booking not found");
      }
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await bookingsApi.startTour(params.id as string);
      const result = response.data;
      if (result.success || result.data) {
        setSuccessMessage("Tour started successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchBooking();
      } else {
        setError(result.message || "Failed to start tour");
      }
    } catch (err: any) {
      console.error("Error starting tour:", err);
      setError(err.response?.data?.message || "Failed to start tour");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCompletion = async () => {
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await bookingsApi.requestCompletion(params.id as string);
      const result = response.data;
      if (result.success || result.data) {
        setSuccessMessage("Completion requested! Waiting for traveler confirmation.");
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchBooking();
      } else {
        setError(result.message || "Failed to request completion");
      }
    } catch (err: any) {
      console.error("Error requesting completion:", err);
      setError(err.response?.data?.message || "Failed to request completion");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: "Pending", color: "bg-gray-100 text-gray-700", icon: FaClock },
      CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: FaCheckCircle },
      IN_PROGRESS: { label: "In Progress", color: "bg-purple-100 text-purple-700", icon: FaPlay },
      AWAITING_TRAVELER_CONFIRMATION: { label: "Awaiting Traveler Confirmation", color: "bg-yellow-100 text-yellow-700", icon: FaFlagCheckered },
      COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: FaCheckCircle },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: FaTimesCircle },
      DISPUTED: { label: "Disputed", color: "bg-orange-100 text-orange-700", icon: FaExclamationTriangle },
    };
    return configs[status] || configs.PENDING;
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="h-7 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-32 bg-gray-100 rounded mt-2 animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-7 w-24 bg-gray-200 rounded mt-1 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-gray-100 rounded mb-1 animate-pulse"></div>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <FaExclamationTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-800">{error || "Booking not found"}</h2>
        <button onClick={() => router.back()} className="mt-4 text-[#008A1E] hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const traveler = booking.users;
  const guideEarnings = Math.round((booking.totalPrice || 0) * 0.85);
  const platformFee = (booking.totalPrice || 0) - guideEarnings;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <FaArrowLeft className="w-4 h-4" /> Back to Tours
      </button>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {booking.packages?.title || "Tour Package"}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig.color}`}>
                <statusConfig.icon className="w-3 h-3" /> {statusConfig.label}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Traveler Paid</p>
            <p className="text-2xl font-bold text-[#008A1E]">Rs {booking.totalPrice?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {booking.status === "CONFIRMED" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <button
            onClick={handleStartTour}
            disabled={actionLoading}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {actionLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaPlay className="w-4 h-4" />}
            Start Tour
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Start the tour to begin your guiding duties
          </p>
        </div>
      )}

      {booking.status === "IN_PROGRESS" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <button
            onClick={handleRequestCompletion}
            disabled={actionLoading}
            className="w-full py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {actionLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaFlagCheckered className="w-4 h-4" />}
            Mark Tour as Completed
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Once marked completed, traveler will be notified to confirm completion
          </p>
        </div>
      )}

      {booking.status === "AWAITING_TRAVELER_CONFIRMATION" && (
        <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <FaClock className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-800">Awaiting Traveler Confirmation</h3>
          </div>
          <p className="text-sm text-yellow-700">
            The traveler has been notified to confirm tour completion. Payment will be released after confirmation.
          </p>
          {booking.autoReleaseAt && (
            <div className="mt-3 p-2 bg-yellow-100 rounded-lg">
              <p className="text-xs text-yellow-700">
                <strong>Auto-release:</strong> {new Date(booking.autoReleaseAt).toLocaleString()}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                If traveler doesn't confirm by this date, payment will be automatically released to you.
              </p>
            </div>
          )}
        </div>
      )}

      {booking.status === "DISPUTED" && (
        <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">Dispute Under Review</h3>
          </div>
          <p className="text-sm text-orange-700">
            A dispute has been raised for this booking. Our team is reviewing the case and will contact both parties.
          </p>
          {booking.disputeReason && (
            <div className="mt-3 p-2 bg-orange-100 rounded-lg">
              <p className="text-xs text-orange-700">
                <strong>Dispute Reason:</strong> {booking.disputeReason}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Traveler Information */}
      {traveler && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-b px-4 sm:px-6 py-3 bg-gray-50">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FaUser className="w-4 h-4" /> Traveler Information
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{traveler.firstName} {traveler.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900 break-all">{traveler.email}</p>
              </div>
              {traveler.phone && (
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{traveler.phone}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Contact the traveler via VoyageX Messages.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tour Details */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b px-4 sm:px-6 py-3 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Tour Details</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">{new Date(booking.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">End Date</p>
              <p className="font-medium text-gray-900">{new Date(booking.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Group Size</p>
              <p className="font-medium text-gray-900">{booking.groupSize} person(s)</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Booking ID</p>
              <p className="font-medium text-gray-900 text-xs">{booking.id}</p>
            </div>
          </div>

          {booking.notes && (
            <div>
              <p className="text-xs text-gray-500">Special Requests</p>
              <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b px-4 sm:px-6 py-3 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Payment Details</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Traveler Paid</span>
            <span className="font-semibold text-gray-900">Rs {booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>Platform Fee (15%)</span>
            <span>Rs {platformFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-600 border-t border-gray-100 pt-2 mt-2">
            <span className="font-semibold">Your Earnings (85%)</span>
            <span className="font-bold text-lg">Rs {guideEarnings.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-medium ${booking.payments?.status === "RELEASED" ? "text-green-600" : "text-yellow-600"}`}>
                {booking.payments?.status === "RELEASED" ? "Released to You" : "Held in Escrow"}
              </span>
            </div>
          </div>
          {booking.payments?.status === "RELEASED" && booking.payments.releasedAt && (
            <div className="flex justify-between text-green-600">
              <span>Released Date</span>
              <span>{new Date(booking.payments.releasedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b px-4 sm:px-6 py-3 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Tour Timeline</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <FaCheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Booking Confirmed</p>
                <p className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {booking.guideConfirmedAt && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <FaFlagCheckered className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">You Marked Tour as Completed</p>
                  <p className="text-xs text-gray-500">{new Date(booking.guideConfirmedAt).toLocaleString()}</p>
                </div>
              </div>
            )}

            {booking.travelerConfirmedAt && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Traveler Confirmed Completion</p>
                  <p className="text-xs text-gray-500">{new Date(booking.travelerConfirmedAt).toLocaleString()}</p>
                </div>
              </div>
            )}

            {booking.payments?.releasedAt && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <FaMoneyBillWave className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Released to You</p>
                  <p className="text-xs text-gray-500">{new Date(booking.payments.releasedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}