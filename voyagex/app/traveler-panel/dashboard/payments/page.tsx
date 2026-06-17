"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaSpinner, 
  FaDollarSign, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle, 
  FaExclamationTriangle,
  FaEye,
  FaCreditCard,
  FaMobileAlt,
  FaWallet,
} from "react-icons/fa";
import { usersApi } from "@/lib/api";

export default function TravelerPaymentsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getMyBookings();
      const result = response.data;
      if (result.success && result.data) {
        setBookings(result.data || []);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
      setError(err.response?.data?.message || "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = (booking: any) => {
    if (booking.payments) return booking.payments.status;
    if (booking.status === "COMPLETED") return "RELEASED";
    if (booking.status === "CANCELLED") return "REFUNDED";
    return "HELD";
  };

  const getPaymentMethodIcon = (method?: string) => {
    if (!method) return <FaCreditCard className="w-3 h-3" />;
    switch (method) {
      case "EASYPAISA": return <FaMobileAlt className="w-3 h-3" />;
      case "JAZZCASH": return <FaMobileAlt className="w-3 h-3" />;
      case "CARD": return <FaCreditCard className="w-3 h-3" />;
      case "BANK_TRANSFER": return <FaWallet className="w-3 h-3" />;
      // Legacy: some historical records may show "VOYAGEX"
      // These display as "Card Payment" via the default case
      default: return <FaCreditCard className="w-3 h-3" />;
    }
  };

  const getPaymentMethodName = (method?: string) => {
    if (!method) return "Card";
    switch (method) {
      case "EASYPAISA": return "EasyPaisa";
      case "JAZZCASH": return "JazzCash";
      case "CARD": return "Credit / Debit Card";
      case "BANK_TRANSFER": return "Bank Transfer";
      // Legacy: some historical records may show "VOYAGEX"
      // Going forward, all card payments are stored as "CARD"
      default: return "Card Payment";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-gray-50 text-gray-700",
      PENDING_REVIEW: "bg-amber-50 text-amber-700",
      HELD: "bg-yellow-50 text-yellow-700",
      CONFIRMED: "bg-blue-50 text-blue-700",
      RELEASED: "bg-green-50 text-green-700",
      PARTIALLY_RELEASED: "bg-teal-50 text-teal-700",
      REFUNDED: "bg-purple-50 text-purple-700",
      FAILED: "bg-red-50 text-red-700",
      CANCELLED: "bg-red-50 text-red-700",
    };
    const icons: Record<string, any> = {
      PENDING: FaClock,
      PENDING_REVIEW: FaClock,
      HELD: FaClock,
      CONFIRMED: FaCheckCircle,
      RELEASED: FaCheckCircle,
      PARTIALLY_RELEASED: FaCheckCircle,
      REFUNDED: FaTimesCircle,
      FAILED: FaTimesCircle,
      CANCELLED: FaTimesCircle,
    };
    const Icon = icons[status] || FaClock;
    const displayStatus = status === "HELD" ? "Held in Escrow" : status;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || "bg-gray-50"}`}>
        <Icon className="w-3 h-3" /> {displayStatus}
      </span>
    );
  };

  const totalPaid = bookings.reduce((sum: number, b) => sum + (b.totalPrice || 0), 0);
  const totalHeld = bookings
    .filter((b) => getPaymentStatus(b) === "HELD")
    .reduce((sum: number, b) => sum + (b.totalPrice || 0), 0);
  const totalReleased = bookings
    .filter((b) => getPaymentStatus(b) === "RELEASED")
    .reduce((sum: number, b) => sum + (b.totalPrice || 0), 0);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse"></div>
              <div className="h-6 sm:h-7 bg-gray-200 rounded w-24 sm:w-32 mb-1 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-100 rounded w-20 sm:w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="flex justify-between items-center">
                <div>
                  <div className="h-5 bg-gray-200 rounded w-32 sm:w-48 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                </div>
                <div className="text-right">
                  <div className="h-5 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track your payment history</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load payments</h3>
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Payments</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track your payment history and escrow status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Paid */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rs {totalPaid.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Total Paid</p>
        </div>

        {/* Held in Escrow */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaClock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rs {totalHeld.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Held in Escrow</p>
        </div>

        {/* Released */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rs {totalReleased.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Released to Guides</p>
        </div>
      </div>

      {/* Payments List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaDollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">No payments yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Your payment history will appear here</p>
          <Link
            href="/packages"
            className="inline-block mt-4 px-4 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006816]"
          >
            Browse Packages
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const paymentStatus = getPaymentStatus(booking);
            const paymentMethod = booking.payments?.method;
            
            return (
              <div
                key={booking.id}
                className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {booking.packages?.title || "Tour Package"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                      <span className="text-xs text-gray-300">•</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        {getPaymentMethodIcon(paymentMethod)}
                        <span>{getPaymentMethodName(paymentMethod)}</span>
                      </div>
                    </div>
                    {booking.payments?.transactionId && (
                      <p className="text-xs text-gray-400 mt-1">
                        Transaction ID: {booking.payments.transactionId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-base sm:text-lg">
                      Rs {booking.totalPrice?.toLocaleString()}
                    </p>
                    <div className="mt-1">{getStatusBadge(paymentStatus)}</div>
                    {paymentStatus === "HELD" && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Released after tour completion
                      </p>
                    )}
                    {paymentStatus === "RELEASED" && booking.payments?.releasedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Released: {new Date(booking.payments.releasedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* View Booking Link */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <Link
                    href={`/traveler-panel/dashboard/bookings/${booking.id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#008A1E] hover:underline"
                  >
                    <FaEye className="w-3 h-3" /> View Booking Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Escrow Info Box */}
      {totalHeld > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <FaClock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-800">About Escrow</h4>
              <p className="text-xs text-blue-700 mt-1">
                Your payment of <strong>Rs {totalHeld.toLocaleString()}</strong> is held securely by VoyageX.
                Funds are only released to the guide after you confirm successful tour completion.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}