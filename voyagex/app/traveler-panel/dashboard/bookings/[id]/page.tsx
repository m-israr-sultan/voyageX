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
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaGavel,
  FaCommentAlt,
} from "react-icons/fa";
import { bookingsApi, messagesApi, reviewsApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import DisputeModal from "@/components/DisputeModal";

export default function TravelerBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

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

  const handleConfirmCompletion = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.confirmCompletion(params.id as string);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Tour confirmed! Payment has been released.");
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchBooking();
      } else {
        setError(result.message || "Failed to confirm completion");
      }
    } catch (err: any) {
      console.error("Error confirming completion:", err);
      setError(err.response?.data?.message || "Failed to confirm completion");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setActionLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.cancel(params.id as string);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Booking cancelled successfully.");
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchBooking();
      } else {
        setError(result.message || "Failed to cancel booking");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!booking?.packages?.id) return;
    setReviewSubmitting(true);
    setError(null);
    try {
      await reviewsApi.create({
        bookingId: booking.id,
        packageId: booking.packages.id,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSubmitted(true);
      setSuccessMessage("Review submitted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: "Pending", color: "bg-gray-100 text-gray-700", icon: FaClock },
      CONFIRMED: { label: "Confirmed", color: "bg-blue-100 text-blue-700", icon: FaCheckCircle },
      IN_PROGRESS: { label: "In Progress", color: "bg-purple-100 text-purple-700", icon: FaClock },
      AWAITING_TRAVELER_CONFIRMATION: { label: "Awaiting Your Confirmation", color: "bg-yellow-100 text-yellow-700", icon: FaFlagCheckered },
      COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: FaCheckCircle },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: FaTimesCircle },
      DISPUTED: { label: "Disputed", color: "bg-orange-100 text-orange-700", icon: FaExclamationTriangle },
    };
    return configs[status] || configs.PENDING;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">{error || "Booking not found"}</h2>
        <button onClick={() => router.back()} className="mt-4 text-[#008A1E] hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const guide = booking.packages?.guides?.users;
  const platformFee = Math.round(booking.totalPrice * 0.15);
  const guideEarnings = booking.totalPrice - platformFee;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <FaArrowLeft className="w-4 h-4" /> Back to Bookings
      </button>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
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
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-[#008A1E]">Rs {booking.totalPrice?.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Cancel - PENDING only */}
      {booking.status === "PENDING" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600 mb-3">
            Your booking is pending guide acceptance. You may cancel before it is confirmed.
          </p>
          <button
            onClick={handleCancel}
            disabled={actionLoading}
            className="w-full py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaTimesCircle className="w-4 h-4" />}
            Cancel Booking
          </button>
        </div>
      )}

      {/* Action Buttons - Only for Traveler */}
      {booking.status === "AWAITING_TRAVELER_CONFIRMATION" && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <button
            onClick={handleConfirmCompletion}
            disabled={actionLoading}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
            Confirm Tour Completion
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Confirm that the tour was completed successfully. This will release payment to the guide.
          </p>
          <button
            onClick={() => setShowDisputeModal(true)}
            className="w-full mt-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2"
          >
            <FaGavel className="w-4 h-4" /> Raise a Dispute
          </button>
        </div>
      )}

      {booking.status === "IN_PROGRESS" && (
        <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <FaClock className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Tour in Progress</h3>
          </div>
          <p className="text-sm text-purple-700">
            Your guide has started the tour. Once completed, you'll receive a confirmation request.
          </p>
        </div>
      )}

      {booking.status === "DISPUTED" && (
        <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-800">Dispute Under Review</h3>
          </div>
          <p className="text-sm text-orange-700">
            Your dispute is being reviewed by our team. We'll notify you once a decision is made.
          </p>
        </div>
      )}

      {booking.status === "COMPLETED" && (
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-800">Tour Completed</h3>
          </div>
          <p className="text-sm text-green-700">
            Thank you for traveling with us! Payment has been released to the guide.
          </p>
          {!reviewSubmitted ? (
            <div className="border-t border-green-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Leave a Review</h4>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)}
                    className={`w-7 h-7 text-xl ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience (optional)..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008A1E] resize-none"
              />
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="mt-2 px-4 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006816] disabled:opacity-50 flex items-center gap-2"
              >
                {reviewSubmitting ? <FaSpinner className="w-3 h-3 animate-spin" /> : null}
                Submit Review
              </button>
            </div>
          ) : (
            <p className="text-sm text-green-600 border-t border-green-200 pt-3">✓ Review submitted. Thank you!</p>
          )}
        </div>
      )}

      {/* Guide Information */}
      {guide && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="border-b px-4 sm:px-6 py-3 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Your Guide</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                {guide.avatar ? (
                  <img src={getImageUrl(guide.avatar)} alt={guide.firstName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl font-bold">
                    {guide.firstName?.[0]}{guide.lastName?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {guide.firstName} {guide.lastName}
                </h3>
                <p className="text-sm text-gray-500">Tour Guide</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={async () => {
                      try {
                        const guideUserId = guide.userId ?? guide.id;
                        const resp = await messagesApi.createConversation({ recipientId: guideUserId });
                        const result = resp.data;
                        if (result.success && result.data) {
                          router.push(`/message/${result.data.id}`);
                        }
                      } catch (err) {
                        console.error("Failed to open conversation:", err);
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-[#008A1E] hover:underline font-medium"
                  >
                    <FaCommentAlt className="w-3 h-3" /> Message via VoyageX
                  </button>
                </div>
              </div>
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
              <p className="text-sm text-gray-700 mt-1">{booking.notes}</p>
            </div>
          )}

          {booking.status === "AWAITING_TRAVELER_CONFIRMATION" && booking.autoReleaseAt && (
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-700">
                ⚠️ If you don't confirm within 7 days, payment will be auto-released on {new Date(booking.autoReleaseAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Breakdown - Traveler View */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="border-b px-4 sm:px-6 py-3 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Payment Breakdown</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Tour Price</span>
            <span className="font-semibold text-gray-900">Rs {booking.totalPrice?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span>Platform Fee (15% - held by VoyageX)</span>
            <span>Rs {platformFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Guide Receives (after completion)</span>
            <span>Rs {guideEarnings.toLocaleString()}</span>
          </div>
          <div className="border-t pt-3 mt-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-medium ${booking.payments?.status === "RELEASED" ? "text-green-600" : "text-yellow-600"}`}>
                {booking.payments?.status === "RELEASED" ? "Released to Guide" : "Held in Escrow"}
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
                  <p className="font-medium text-gray-900">Tour Completed by Guide</p>
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
                  <p className="font-medium text-gray-900">You Confirmed Completion</p>
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
                  <p className="font-medium text-gray-900">Payment Released to Guide</p>
                  <p className="text-xs text-gray-500">{new Date(booking.payments.releasedAt).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        bookingId={params.id as string}
        onSuccess={() => {
          setShowDisputeModal(false);
          fetchBooking();
          setSuccessMessage("Dispute raised successfully. Admin will review.");
          setTimeout(() => setSuccessMessage(null), 3000);
        }}
      />
    </div>
  );
}