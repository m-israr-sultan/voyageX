"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaSpinner, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaEye,
  FaDollarSign,
  FaWallet,
} from "react-icons/fa";
import { bookingsApi } from "@/lib/api";

export default function AgencyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.getAll();
      const result = response.data;
      if (result.success && result.data) {
        const items = result.data || [];
        setBookings(Array.isArray(items) ? items : []);
      } else {
        setBookings([]);
      }
    } catch (err: any) { 
      console.error("Error fetching bookings:", err);
      setError(err.response?.data?.message || "Failed to load bookings"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleStatusUpdate = async (id: string, action: "confirm" | "complete" | "cancel") => {
    setActionLoading(id);
    setError(null);
    setSuccessMessage(null);
    try {
      if (action === "confirm") {
        await bookingsApi.confirmCompletion(id);
        setSuccessMessage("Booking confirmed successfully!");
      } else if (action === "complete") {
        await bookingsApi.confirmCompletion(id);
        setSuccessMessage("Booking marked as completed!");
      } else {
        await bookingsApi.cancel(id);
        setSuccessMessage("Booking cancelled successfully!");
      }
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchBookings();
    } catch (err: any) { 
      setError(err.response?.data?.message || "Failed to update booking status");
      setTimeout(() => setError(null), 3000);
    } finally { 
      setActionLoading(null); 
    }
  };

  const filteredBookings = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  const stats = { 
    total: bookings.length, 
    pending: bookings.filter((b) => b.status === "PENDING").length, 
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length, 
    completed: bookings.filter((b) => b.status === "COMPLETED").length, 
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    inProgress: bookings.filter((b) => b.status === "IN_PROGRESS").length,
    disputed: bookings.filter((b) => b.status === "DISPUTED").length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { 
      PENDING: "bg-yellow-50 text-yellow-700", 
      CONFIRMED: "bg-blue-50 text-blue-700", 
      IN_PROGRESS: "bg-purple-50 text-purple-700",
      AWAITING_TRAVELER_CONFIRMATION: "bg-orange-50 text-orange-700",
      COMPLETED: "bg-green-50 text-green-700", 
      CANCELLED: "bg-red-50 text-red-700",
      DISPUTED: "bg-red-50 text-red-700",
    };
    const icons: Record<string, any> = { 
      PENDING: FaClock, 
      CONFIRMED: FaCheckCircle, 
      IN_PROGRESS: FaClock,
      AWAITING_TRAVELER_CONFIRMATION: FaClock,
      COMPLETED: FaCheckCircle, 
      CANCELLED: FaTimesCircle,
      DISPUTED: FaExclamationTriangle,
    };
    const Icon = icons[status] || FaClock;
    const displayStatus = status === "AWAITING_TRAVELER_CONFIRMATION" ? "Awaiting Confirmation" : status;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || "bg-gray-50"}`}>
        <Icon className="w-3 h-3" /> {displayStatus}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "HELD":
        return <span className="flex items-center gap-1 text-xs text-yellow-600"><FaWallet className="w-3 h-3" /> Held in Escrow</span>;
      case "RELEASED":
        return <span className="flex items-center gap-1 text-xs text-green-600"><FaDollarSign className="w-3 h-3" /> Released</span>;
      case "REFUNDED":
        return <span className="flex items-center gap-1 text-xs text-red-600"><FaTimesCircle className="w-3 h-3" /> Refunded</span>;
      default:
        return null;
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg border p-2 sm:p-3">
              <div className="h-5 sm:h-7 bg-gray-200 rounded w-8 sm:w-12 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-12 sm:w-16 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-40 sm:w-56 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-32 sm:w-40 mb-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-48 sm:w-64 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error && bookings.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Bookings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage traveler bookings</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load bookings</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchBookings()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Bookings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage traveler bookings for your agency</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          <FaCheckCircle className="inline w-4 h-4 mr-1" /> {successMessage}
        </div>
      )}

      {/* Error Message (non-fatal) */}
      {error && bookings.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: "All", count: stats.total, value: "ALL", color: "bg-gray-50" },
          { label: "Pending", count: stats.pending, value: "PENDING", color: "bg-yellow-50" },
          { label: "Confirmed", count: stats.confirmed, value: "CONFIRMED", color: "bg-blue-50" },
          { label: "In Progress", count: stats.inProgress, value: "IN_PROGRESS", color: "bg-purple-50" },
          { label: "Completed", count: stats.completed, value: "COMPLETED", color: "bg-green-50" },
          { label: "Disputed", count: stats.disputed, value: "DISPUTED", color: "bg-red-50" },
        ].map((item) => (
          <button 
            key={item.value} 
            onClick={() => setFilter(item.value)} 
            className={`${item.color} rounded-xl border p-2 sm:p-3 text-center hover:shadow-md transition-all ${
              filter === item.value ? "ring-2 ring-[#008A1E]" : ""
            }`}
          >
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{item.count}</p>
            <p className="text-xs text-gray-600">{item.label}</p>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
            <FaCalendarAlt className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base sm:text-lg font-medium text-gray-700">No bookings found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {filter === "ALL" 
                ? "You don't have any bookings yet" 
                : `No bookings in ${filter.toLowerCase()} category`}
            </p>
            {filter !== "ALL" && (
              <button
                onClick={() => setFilter("ALL")}
                className="mt-3 text-sm text-[#008A1E] hover:underline"
              >
                View all bookings
              </button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div 
              key={booking.id} 
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {booking.packages?.title || "Tour Package"}
                    </h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  
                  <div className="space-y-1 text-xs sm:text-sm text-gray-500">
                    <p>Traveler: {booking.users?.firstName} {booking.users?.lastName}</p>
                    <p className="flex items-center gap-1">
                      <FaCalendarAlt className="w-3 h-3" />
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </p>
                    <p>Group: {booking.groupSize} person(s)</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <p className="font-semibold text-gray-900">Rs {booking.totalPrice?.toLocaleString()}</p>
                      {booking.payments && getPaymentStatusBadge(booking.payments.status)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/agency-panel/dashboard/bookings/${booking.id}`}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors"
                  >
                    <FaEye className="w-3 h-3" /> View Details
                  </Link>
                </div>
              </div>
              
              {/* Action Buttons */}
              {booking.status === "PENDING" && (
                <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleStatusUpdate(booking.id, "confirm")} 
                    disabled={actionLoading === booking.id} 
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === booking.id ? <FaSpinner className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Booking"}
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(booking.id, "cancel")} 
                    disabled={actionLoading === booking.id} 
                    className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 disabled:opacity-50 transition-colors"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
              
              {booking.status === "CONFIRMED" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button 
                    onClick={() => handleStatusUpdate(booking.id, "complete")} 
                    disabled={actionLoading === booking.id} 
                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === booking.id ? <FaSpinner className="w-4 h-4 animate-spin mx-auto" /> : "Mark as Completed"}
                  </button>
                </div>
              )}
              
              {booking.status === "DISPUTED" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="p-2 bg-orange-50 rounded-lg text-center">
                    <p className="text-xs text-orange-700">Dispute raised - Awaiting admin resolution</p>
                  </div>
                </div>
              )}
              
              {booking.status === "AWAITING_TRAVELER_CONFIRMATION" && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="p-2 bg-yellow-50 rounded-lg text-center">
                    <p className="text-xs text-yellow-700">Awaiting traveler confirmation to release payment</p>
                    {booking.autoReleaseAt && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Auto-release: {new Date(booking.autoReleaseAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}