"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaSpinner, 
  FaBriefcase, 
  FaUsers, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaStar, 
  FaShieldAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { agenciesApi, bookingsApi, packagesApi } from "@/lib/api";

export default function AgencyDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({ 
    packages: 0, 
    guides: 0, 
    bookings: 0, 
    earnings: 0, 
    reviews: 0, 
    verified: false,
    pendingBookings: 0,
    activePackages: 0,
    completedBookings: 0,
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
          const profileRes = await agenciesApi.getMyProfile();
          if (profileRes.data?.success && profileRes.data?.data) {
            profile = profileRes.data.data;
          }
        } catch (profileErr: any) {
          console.log("Profile not found yet - this is normal for new agencies");
          if (profileErr.response?.status !== 404) {
            throw profileErr;
          }
        }

        // Get packages
        let packages: any[] = [];
        try {
          const pkgRes = await packagesApi.getMyPackages();
          if (pkgRes.data?.success && pkgRes.data?.data) {
            packages = pkgRes.data.data?.items || pkgRes.data.data || [];
          }
        } catch (pkgErr: any) {
          console.log("No packages yet - this is normal for new agencies");
          if (pkgErr.response?.status !== 404) {
            throw pkgErr;
          }
        }

        // Get bookings
        let bookings: any[] = [];
        try {
          const bookingsRes = await bookingsApi.getAll();
          if (bookingsRes.data?.success && bookingsRes.data?.data) {
            bookings = bookingsRes.data.data || [];
          }
        } catch (bookingsErr: any) {
          console.log("No bookings yet - this is normal for new agencies");
          if (bookingsErr.response?.status !== 404) {
            throw bookingsErr;
          }
        }

        const completedBookings = bookings.filter((b: any) => b.status === "COMPLETED");
        const pendingBookings = bookings.filter((b: any) => b.status === "PENDING" || b.status === "CONFIRMED");
        const activePackages = packages.filter((p: any) => p.isActive !== false);
        
        const totalEarnings = completedBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0);

        setStats({
          packages: Array.isArray(packages) ? packages.length : 0,
          guides: profile?.guides?.length || 0,
          bookings: Array.isArray(bookings) ? bookings.length : 0,
          earnings: totalEarnings,
          reviews: profile?.totalReviews || 0,
          verified: profile?.isVerified || false,
          pendingBookings: pendingBookings.length,
          activePackages: activePackages.length,
          completedBookings: completedBookings.length,
        });
      } catch (err: any) {
        console.error("Error fetching dashboard:", err);
        setError(err.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg mb-2 sm:mb-3 animate-pulse"></div>
              <div className="h-6 sm:h-7 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Agency overview</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load dashboard</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg">Try Again</button>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Packages", count: stats.packages, icon: FaBriefcase, color: "bg-blue-50 text-blue-600", href: "/agency-panel/dashboard/packages" },
    { label: "Active Packages", count: stats.activePackages, icon: FaCheckCircle, color: "bg-green-50 text-green-600", href: "/agency-panel/dashboard/packages" },
    { label: "Guides", count: stats.guides, icon: FaUsers, color: "bg-purple-50 text-purple-600", href: "/agency-panel/dashboard/guides" },
    { label: "Total Bookings", count: stats.bookings, icon: FaCalendarAlt, color: "bg-indigo-50 text-indigo-600", href: "/agency-panel/dashboard/bookings" },
    { label: "Pending", count: stats.pendingBookings, icon: FaClock, color: "bg-yellow-50 text-yellow-600", href: "/agency-panel/dashboard/bookings" },
    { label: "Completed", count: stats.completedBookings, icon: FaCheckCircle, color: "bg-green-50 text-green-600", href: "/agency-panel/dashboard/bookings" },
    { label: "Earnings", count: `PKR ${stats.earnings.toLocaleString()}`, icon: FaDollarSign, color: "bg-emerald-50 text-emerald-600", href: "/agency-panel/dashboard/earnings" },
    { label: "Reviews", count: stats.reviews, icon: FaStar, color: "bg-yellow-50 text-yellow-600", href: "/agency-panel/dashboard/reviews" },
    { label: "Verified", count: stats.verified ? "Yes" : "No", icon: FaShieldAlt, color: stats.verified ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600", href: "/agency-panel/dashboard/verification" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Welcome to your agency dashboard!</p>
      </div>

      {stats.packages === 0 && stats.bookings === 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <FaBriefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Welcome to VoyageX!</h3>
              <p className="text-sm text-blue-700 mt-1">Complete your agency profile and create your first package.</p>
              <Link href="/agency-panel/dashboard/profile" className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Complete Profile →</Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] group">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${card.color} flex items-center justify-center mb-2 sm:mb-3`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{card.count}</h3>
              <p className="text-xs text-gray-500">{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link href="/agency-panel/dashboard/packages/create" className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><FaBriefcase className="w-4 h-4 text-blue-600" /></div>
              <div><p className="font-medium text-gray-900">Create Package</p><p className="text-xs text-gray-500">Add new tour package</p></div>
            </div>
          </Link>
          <Link href="/agency-panel/dashboard/guides" className="flex items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center"><FaUsers className="w-4 h-4 text-purple-600" /></div>
              <div><p className="font-medium text-gray-900">Manage Guides</p><p className="text-xs text-gray-500">Add or remove guides</p></div>
            </div>
          </Link>
          <Link href="/agency-panel/dashboard/bookings" className="flex items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><FaCalendarAlt className="w-4 h-4 text-green-600" /></div>
              <div><p className="font-medium text-gray-900">View Bookings</p><p className="text-xs text-gray-500">Manage all bookings</p></div>
            </div>
          </Link>
          <Link href="/agency-panel/dashboard/verification" className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg hover:bg-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"><FaShieldAlt className="w-4 h-4 text-orange-600" /></div>
              <div><p className="font-medium text-gray-900">Verification</p><p className="text-xs text-gray-500">Complete verification</p></div>
            </div>
          </Link>
        </div>
      </div>

      {!stats.verified && (
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <FaShieldAlt className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div><h4 className="text-sm font-semibold text-yellow-800">Agency Not Verified</h4><p className="text-xs text-yellow-700 mt-1">Complete verification to unlock full features.</p>
              <Link href="/agency-panel/dashboard/verification" className="inline-block mt-2 text-xs text-yellow-800 font-medium hover:underline">Start Verification →</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}