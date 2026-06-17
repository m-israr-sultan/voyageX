"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaSpinner, 
  FaCalendarAlt, 
  FaHeart, 
  FaStar, 
  FaEnvelope, 
  FaUser, 
  FaArrowRight, 
  FaDollarSign,
  FaExclamationTriangle 
} from "react-icons/fa";
import { usersApi } from "@/lib/api";

export default function TravelerDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ bookings: 0, wishlist: 0, reviews: 0, payments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [bookingsRes, wishlistRes, reviewsRes] = await Promise.all([
          usersApi.getMyBookings(),
          usersApi.getMyWishlist(),
          usersApi.getMyReviews(),
        ]);
        
        const bookings = bookingsRes.data?.data || [];
        const wishlist = wishlistRes.data?.data || [];
        const reviews = reviewsRes.data?.data || [];
        
        // Calculate payments count (completed bookings with payments)
        const payments = bookings.filter((b: any) => b.payments?.status === "RELEASED" || b.status === "COMPLETED");
        
        setStats({
          bookings: bookings.length,
          wishlist: wishlist.length,
          reviews: reviews.length,
          payments: payments.length,
        });
      } catch (err: any) {
        console.error("Error fetching dashboard:", err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse"></div>
              <div className="h-6 sm:h-7 bg-gray-200 rounded w-12 sm:w-16 mb-1 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-100 rounded w-16 sm:w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="h-5 sm:h-6 bg-gray-200 rounded w-28 sm:w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 sm:h-20 bg-gray-100 rounded-lg animate-pulse"></div>
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Welcome back! Manage your trips.</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load dashboard</h3>
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

  const cards = [
    { label: "My Bookings", count: stats.bookings, icon: FaCalendarAlt, color: "bg-blue-50 text-blue-600", href: "/traveler-panel/dashboard/bookings" },
    { label: "Wishlist", count: stats.wishlist, icon: FaHeart, color: "bg-red-50 text-red-600", href: "/traveler-panel/dashboard/wishlist" },
    { label: "My Reviews", count: stats.reviews, icon: FaStar, color: "bg-yellow-50 text-yellow-600", href: "/traveler-panel/dashboard/reviews" },
    { label: "Payments", count: stats.payments, icon: FaDollarSign, color: "bg-emerald-50 text-emerald-600", href: "/traveler-panel/dashboard/payments" },
    { label: "Messages", count: "—", icon: FaEnvelope, color: "bg-green-50 text-green-600", href: "/message" },
  ];

  const quickActions = [
    { label: "Find a Guide", description: "Hire local experts", icon: FaUser, color: "green", path: "/guide" },
    { label: "Browse Packages", description: "Tour packages", icon: FaCalendarAlt, color: "blue", path: "/packages" },
    { label: "Explore Destinations", description: "Discover places", icon: FaStar, color: "purple", path: "/destination" },
    { label: "View Agencies", description: "Tour operators", icon: FaStar, color: "orange", path: "/agency" },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; hover: string; iconBg: string; iconColor: string }> = {
      green: { bg: "bg-green-50", hover: "hover:bg-green-100", iconBg: "bg-green-100", iconColor: "text-green-600" },
      blue: { bg: "bg-blue-50", hover: "hover:bg-blue-100", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      purple: { bg: "bg-purple-50", hover: "hover:bg-purple-100", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
      orange: { bg: "bg-orange-50", hover: "hover:bg-orange-100", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
    };
    return colors[color] || colors.green;
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Welcome back! Manage your trips and bookings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.color} flex items-center justify-center mb-2 sm:mb-3`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{card.count}</h3>
              <p className="text-xs text-gray-500">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colors = getColorClasses(action.color);
            return (
              <button
                key={action.label}
                onClick={() => router.push(action.path)}
                className={`flex items-center justify-between p-3 sm:p-4 ${colors.bg} rounded-lg ${colors.hover} transition-all group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.iconColor}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900 text-sm sm:text-base">{action.label}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
                <FaArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 ${colors.iconColor} group-hover:translate-x-1 transition-transform`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Section - Optional */}
      {stats.bookings > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Link href="/traveler-panel/dashboard/bookings" className="text-xs sm:text-sm text-[#008A1E] hover:underline">
              View all
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            You have {stats.bookings} active booking{stats.bookings !== 1 ? 's' : ''}. 
            {stats.payments > 0 && ` ${stats.payments} completed payment${stats.payments !== 1 ? 's' : ''}.`}
          </p>
        </div>
      )}
    </div>
  );
}