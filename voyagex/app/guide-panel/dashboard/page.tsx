"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaRoute,
  FaDollarSign,
  FaStar,
  FaUser,
  FaSpinner,
  FaArrowRight,
  FaEnvelope,
  FaClock,
  FaFlagCheckered,
  FaExclamationTriangle,
} from "react-icons/fa";
import { guidesApi, bookingsApi } from "@/lib/api";

export default function GuideDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ 
    tours: 0, 
    earnings: 0, 
    reviews: 0, 
    pending: 0,
    inProgress: 0,
    awaitingConfirmation: 0,
    disputed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Get profile
        let profile = null;
        try {
          const profileRes = await guidesApi.getMyProfile();
          if (profileRes.data?.success && profileRes.data?.data) {
            profile = profileRes.data.data;
          }
        } catch (profileErr) {
          console.log("Profile not found yet - this is normal for new guides");
        }

        // Get bookings
        let bookings = [];
        try {
          const bookingsRes = await bookingsApi.getAll();
          if (bookingsRes.data?.success && bookingsRes.data?.data) {
            bookings = bookingsRes.data.data || [];
          }
        } catch (bookingsErr) {
          console.log("No bookings yet - this is normal for new guides");
        }

        const completed = bookings.filter((b: any) => b.status === "COMPLETED").length;
        const pending = bookings.filter((b: any) => b.status === "PENDING" || b.status === "CONFIRMED").length;
        const inProgress = bookings.filter((b: any) => b.status === "IN_PROGRESS").length;
        const awaitingConfirmation = bookings.filter((b: any) => b.status === "AWAITING_TRAVELER_CONFIRMATION").length;
        const disputed = bookings.filter((b: any) => b.status === "DISPUTED").length;
        
        // Calculate earnings from completed bookings (85% of total)
        const totalEarnings = bookings
          .filter((b: any) => b.status === "COMPLETED")
          .reduce((sum: number, b: any) => sum + Math.round((b.totalPrice || 0) * 0.85), 0);

        setStats({
          tours: completed,
          earnings: totalEarnings,
          reviews: profile?.totalReviews || 0,
          pending: pending,
          inProgress: inProgress,
          awaitingConfirmation: awaitingConfirmation,
          disputed: disputed,
        });
      } catch (err: any) {
        console.error("Error fetching dashboard:", err);
        // Don't set error for missing profile - it's normal for new guides
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || "Failed to load dashboard");
        }
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse"></div>
              <div className="h-6 sm:h-7 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Only show error for actual API failures (not missing profile)
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Overview of your guide activity</p>
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
    { label: "Completed Tours", count: stats.tours, icon: FaRoute, color: "bg-green-50 text-green-600" },
    { label: "In Progress", count: stats.inProgress, icon: FaClock, color: "bg-purple-50 text-purple-600" },
    { label: "Pending", count: stats.pending, icon: FaSpinner, color: "bg-yellow-50 text-yellow-600" },
    { label: "Awaiting Confirmation", count: stats.awaitingConfirmation, icon: FaFlagCheckered, color: "bg-orange-50 text-orange-600" },
    { label: "Total Earnings", count: `PKR ${stats.earnings.toLocaleString()}`, icon: FaDollarSign, color: "bg-blue-50 text-blue-600" },
    { label: "Reviews", count: stats.reviews, icon: FaStar, color: "bg-purple-50 text-purple-600" },
    { label: "Disputed", count: stats.disputed, icon: FaExclamationTriangle, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Welcome to your guide dashboard! Complete your profile to start receiving bookings.</p>
      </div>

      {/* Welcome Card for New Guides */}
      {stats.tours === 0 && stats.pending === 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FaUser className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Welcome to VoyageX!</h3>
              <p className="text-sm text-blue-700 mt-1">
                Complete your profile to help travelers find you. Add your bio, languages, specialities, and destination photos.
              </p>
              <button 
                onClick={() => router.push("/guide-panel/dashboard/profile")}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Complete Profile →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <div 
            key={card.label} 
            className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.color} flex items-center justify-center mb-2 sm:mb-3`}>
              <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{card.count}</h3>
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Link href="/guide-panel/dashboard/tours" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group">
          <FaRoute className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">My Tours</h3>
          <p className="text-xs text-gray-500 mt-1">View and manage all bookings</p>
        </Link>
        
        <Link href="/guide-panel/dashboard/profile" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group">
          <FaUser className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Profile</h3>
          <p className="text-xs text-gray-500 mt-1">Update your details and availability</p>
        </Link>

        <Link href="/guide-panel/dashboard/notifications" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group">
          <FaEnvelope className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
          <p className="text-xs text-gray-500 mt-1">View your alerts and updates</p>
        </Link>

        <Link href="/guide-panel/dashboard/earnings" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group">
          <FaDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Earnings</h3>
          <p className="text-xs text-gray-500 mt-1">Track your income and payouts</p>
        </Link>
      </div>
    </div>
  );
}