"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSpinner,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaPlay,
  FaFlagCheckered,
  FaUser,
  FaEye,
  FaExclamationTriangle,
  FaDollarSign,
} from "react-icons/fa";
import { bookingsApi } from "@/lib/api";

export default function GuideToursPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookingsApi.getAll();
      const result = response.data;
      if (result.success && result.data) {
        setBookings(result.data || []);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error("Error fetching bookings:", err);
      setError(err.response?.data?.message || "Failed to load tours");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTour = async (bookingId: string) => {
    setActionLoading(bookingId);
    setError(null);
    try {
      const response = await bookingsApi.startTour(bookingId);
      const result = response.data;
      if (result.success || result.data) {
        setSuccessMessage("Tour started successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchBookings();
      } else {
        setError(result.message || "Failed to start tour");
      }
    } catch (err: any) {
      console.error("Error starting tour:", err);
      setError(err.response?.data?.message || "Failed to start tour");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestCompletion = async (bookingId: string) => {
    setActionLoading(bookingId);
    setError(null);
    try {
      const response = await bookingsApi.requestCompletion(bookingId);
      const result = response.data;
      if (result.success || result.data) {
        setSuccessMessage("Completion requested! Waiting for traveler confirmation.");
        setTimeout(() => setSuccessMessage(null), 3000);
        await fetchBookings();
      } else {
        setError(result.message || "Failed to request completion");
      }
    } catch (err: any) {
      console.error("Error requesting completion:", err);
      setError(err.response?.data?.message || "Failed to request completion");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredBookings =
    filter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
    inProgress: bookings.filter((b) => b.status === "IN_PROGRESS").length,
    awaiting: bookings.filter((b) => b.status === "AWAITING_TRAVELER_CONFIRMATION").length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    disputed: bookings.filter((b) => b.status === "DISPUTED").length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-gray-100 text-gray-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-purple-100 text-purple-700",
      AWAITING_TRAVELER_CONFIRMATION: "bg-yellow-100 text-yellow-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
      DISPUTED: "bg-orange-100 text-orange-700",
    };
    const icons: Record<string, any> = {
      PENDING: FaClock,
      CONFIRMED: FaCheckCircle,
      IN_PROGRESS: FaPlay,
      AWAITING_TRAVELER_CONFIRMATION: FaFlagCheckered,
      COMPLETED: FaCheckCircle,
      CANCELLED: FaTimesCircle,
      DISPUTED: FaExclamationTriangle,
    };
    const Icon = icons[status] || FaClock;
    const displayStatus = status === "AWAITING_TRAVELER_CONFIRMATION" 
      ? "Awaiting Confirmation" 
      : status.replace(/_/g, " ");
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || "bg-gray-100"}`}
      >
        <Icon className="w-3 h-3" /> {displayStatus}
      </span>
    );
  };

  const getActionButtons = (booking: any) => {
    switch (booking.status) {
      case "CONFIRMED":
        return (
          <button
            onClick={() => handleStartTour(booking.id)}
            disabled={actionLoading === booking.id}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
          >
            {actionLoading === booking.id ? (
              <FaSpinner className="w-3 h-3 animate-spin" />
            ) : (
              <FaPlay className="w-3 h-3" />
            )}
            Start Tour
          </button>
        );
      case "IN_PROGRESS":
        return (
          <button
            onClick={() => handleRequestCompletion(booking.id)}
            disabled={actionLoading === booking.id}
            className="px-3 py-1.5 bg-yellow-600 text-white text-xs rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1 transition-colors"
          >
            {actionLoading === booking.id ? (
              <FaSpinner className="w-3 h-3 animate-spin" />
            ) : (
              <FaFlagCheckered className="w-3 h-3" />
            )}
            Mark Complete
          </button>
        );
      case "AWAITING_TRAVELER_CONFIRMATION":
        return (
          <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
            Waiting for traveler
          </div>
        );
      case "COMPLETED":
        return (
          <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
            Payment Released
          </div>
        );
      case "DISPUTED":
        return (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Under Review
          </div>
        );
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
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-40 sm:w-56 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-32 sm:w-40 mb-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-24 sm:w-32 animate-pulse"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Tours</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage your tour bookings and track status
        </p>
      </div>

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: "Total", count: stats.total, color: "bg-gray-50" },
          { label: "Confirmed", count: stats.confirmed, color: "bg-blue-50" },
          { label: "In Progress", count: stats.inProgress, color: "bg-purple-50" },
          { label: "Awaiting", count: stats.awaiting, color: "bg-yellow-50" },
          { label: "Completed", count: stats.completed, color: "bg-green-50" },
          { label: "Disputed", count: stats.disputed, color: "bg-orange-50" },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() =>
              setFilter(item.label === "Total" ? "ALL" : 
                item.label === "Awaiting" ? "AWAITING_TRAVELER_CONFIRMATION" :
                item.label.toUpperCase().replace(" ", "_"))
            }
            className={`${item.color} rounded-lg border p-2 sm:p-3 text-center hover:shadow-md transition-all ${
              (filter === "ALL" && item.label === "Total") ||
              filter === (item.label === "Awaiting" ? "AWAITING_TRAVELER_CONFIRMATION" : item.label.toUpperCase().replace(" ", "_"))
                ? "ring-2 ring-[#008A1E]"
                : ""
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
            <h3 className="text-base sm:text-lg font-medium text-gray-700">No tours found</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {filter === "ALL" 
                ? "You don't have any bookings yet" 
                : `No bookings in ${filter.toLowerCase().replace(/_/g, " ")} category`}
            </p>
            {filter !== "ALL" && (
              <button
                onClick={() => setFilter("ALL")}
                className="mt-3 text-sm text-[#008A1E] hover:underline"
              >
                View all tours
              </button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking) => {
            const guideEarnings = Math.round((booking.totalPrice || 0) * 0.85);
            
            return (
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
                      <p className="flex items-center gap-1">
                        <FaUser className="w-3 h-3" />
                        Traveler: {booking.users?.firstName} {booking.users?.lastName}
                      </p>
                      <p className="flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        {new Date(booking.startDate).toLocaleDateString()} -{" "}
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      <p>Group Size: {booking.groupSize} person(s)</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1">
                        <p className="font-semibold text-gray-900">
                          Traveler Paid: Rs {booking.totalPrice?.toLocaleString()}
                        </p>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <FaDollarSign className="w-3 h-3" />
                          Your Earnings: Rs {guideEarnings.toLocaleString()}
                        </p>
                      </div>
                      {booking.status === "AWAITING_TRAVELER_CONFIRMATION" && booking.autoReleaseAt && (
                        <p className="text-xs text-yellow-600 mt-1">
                          Auto-release: {new Date(booking.autoReleaseAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href={`/guide-panel/dashboard/tours/${booking.id}`}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors"
                    >
                      <FaEye className="w-3 h-3" /> View Details
                    </Link>
                    {getActionButtons(booking)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}