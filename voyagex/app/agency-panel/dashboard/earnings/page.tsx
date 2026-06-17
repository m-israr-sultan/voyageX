"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaSpinner, 
  FaDollarSign, 
  FaChartLine, 
  FaChartBar, 
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaEye,
  FaCalendarAlt,
} from "react-icons/fa";
import { bookingsApi } from "@/lib/api";

export default function AgencyEarningsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
        setError(err.response?.data?.message || "Failed to load earnings data");
      } finally { 
        setLoading(false); 
      }
    };
    fetchBookings();
  }, []);

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED");
  const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const pendingBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS");
  const pendingEarnings = pendingBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const awaitingConfirmation = bookings.filter((b) => b.status === "AWAITING_TRAVELER_CONFIRMATION");
  const awaitingEarnings = awaitingConfirmation.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  // Monthly data for completed bookings
  const monthlyData = completedBookings.reduce((acc: Record<string, { earnings: number; count: number }>, b) => {
    const month = new Date(b.endDate).toLocaleString("default", { month: "short", year: "numeric" });
    const earnings = b.totalPrice || 0;
    if (!acc[month]) {
      acc[month] = { earnings: 0, count: 0 };
    }
    acc[month].earnings += earnings;
    acc[month].count += 1;
    return acc;
  }, {});
  const months = Object.keys(monthlyData).reverse();
  const earningsValues = months.map(m => monthlyData[m].earnings);
  const maxEarnings = Math.max(...earningsValues, 1);
  const totalCompletedTours = completedBookings.length;

  // Calculate growth (compare last month vs previous month)
  const getGrowth = () => {
    if (months.length < 2) return null;
    const lastMonth = months[0];
    const previousMonth = months[1];
    const lastMonthEarnings = monthlyData[lastMonth]?.earnings || 0;
    const previousMonthEarnings = monthlyData[previousMonth]?.earnings || 0;
    if (previousMonthEarnings === 0) return 100;
    return ((lastMonthEarnings - previousMonthEarnings) / previousMonthEarnings) * 100;
  };
  const growth = getGrowth();

  // Status distribution for pie chart
  const statusCounts = {
    COMPLETED: bookings.filter((b) => b.status === "COMPLETED").length,
    CONFIRMED: bookings.filter((b) => b.status === "CONFIRMED").length,
    IN_PROGRESS: bookings.filter((b) => b.status === "IN_PROGRESS").length,
    AWAITING_CONFIRMATION: bookings.filter((b) => b.status === "AWAITING_TRAVELER_CONFIRMATION").length,
    CANCELLED: bookings.filter((b) => b.status === "CANCELLED").length,
  };
  const totalBookings = bookings.length || 1;

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse"></div>
              <div className="h-6 sm:h-7 bg-gray-200 rounded w-24 sm:w-32 mb-1 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-100 rounded w-20 sm:w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex-1 h-6 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Earnings</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track your agency income</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load earnings</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Earnings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Track your agency income and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Earned */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <FaDollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            {growth !== null && growth > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <FaArrowUp className="w-2.5 h-2.5" /> {Math.abs(growth).toFixed(0)}%
              </span>
            )}
            {growth !== null && growth < 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                <FaArrowDown className="w-2.5 h-2.5" /> {Math.abs(growth).toFixed(0)}%
              </span>
            )}
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rs {totalEarnings.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Total Earned</p>
          <p className="text-xs text-green-600 mt-1">From {totalCompletedTours} completed tour{totalCompletedTours !== 1 ? 's' : ''}</p>
        </div>

        {/* Pending Earnings */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-yellow-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaChartLine className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rs {pendingEarnings.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Pending (Active Tours)</p>
          <p className="text-xs text-yellow-600 mt-1">{pendingBookings.length} tour{pendingBookings.length !== 1 ? 's' : ''} in progress</p>
        </div>

        {/* Awaiting Confirmation */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaWallet className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Rs {awaitingEarnings.toLocaleString()}</h3>
          <p className="text-xs text-gray-500">Awaiting Confirmation</p>
          <p className="text-xs text-orange-600 mt-1">{awaitingConfirmation.length} tour{awaitingConfirmation.length !== 1 ? 's' : ''} waiting for traveler</p>
        </div>

        {/* Completed Tours */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-2 sm:mb-3">
            <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{totalCompletedTours}</h3>
          <p className="text-xs text-gray-500">Completed Tours</p>
        </div>
      </div>

      {/* Monthly Earnings Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Monthly Earnings</h2>
        {months.length === 0 ? (
          <div className="text-center py-8">
            <FaChartBar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No completed tours yet</p>
            <p className="text-xs text-gray-400 mt-1">Complete tours to see your earnings history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {months.map((month, i) => {
              const earnings = earningsValues[i];
              const percentage = (earnings / maxEarnings) * 100;
              const count = monthlyData[month].count;
              return (
                <div key={month} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-600 w-24 font-medium">{month}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-[#008A1E] h-full rounded-full transition-all duration-500 flex items-center justify-end px-2"
                          style={{ width: `${percentage}%`, minWidth: '40px' }}
                        >
                          <span className="text-xs text-white font-medium">
                            Rs {earnings.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 w-12 text-right">
                        ({count} tour{count !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {completedBookings.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/agency-panel/dashboard/bookings" className="text-xs text-[#008A1E] hover:underline">
              View all bookings →
            </Link>
          </div>
          <div className="space-y-3">
            {completedBookings.slice(0, 5).map((booking) => (
              <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {booking.packages?.title || "Tour Package"}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3" />
                    {new Date(booking.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+ Rs {booking.totalPrice?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Released</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaWallet className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">How Earnings Work</h4>
            <p className="text-xs text-blue-700 mt-1">
              You earn <strong>100%</strong> of the total booking amount. VoyageX deducts a platform fee (15%) 
              from guide bookings only. For agency packages, you receive the full amount. Payments are held 
              in escrow and released after traveler confirms tour completion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}