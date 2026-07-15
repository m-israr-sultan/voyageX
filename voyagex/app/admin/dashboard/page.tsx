"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaUsers,
  FaDollarSign,
  FaUserClock,
  FaBell,
  FaEye,
  FaSpinner,
  FaArrowUp,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    openDisputes: 0,
    totalVisitors: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const statsResponse = await adminApi.getStats();
        const statsResult = statsResponse.data;
        if (statsResult.success && statsResult.data) {
          setStats({
            totalUsers: statsResult.data.totalUsers || statsResult.data.users || 0,
            totalRevenue: statsResult.data.totalRevenue || 0,
            pendingVerifications:
              statsResult.data.pendingVerifications ||
              (statsResult.data.guides?.pending || 0) + (statsResult.data.agencies?.pending || 0),
            openDisputes: statsResult.data.openDisputes || 0,
            totalVisitors: statsResult.data.totalVisitors || statsResult.data.users || 0,
          });
        }

        const usersResponse = await adminApi.getUsers({ limit: 5 });
        const usersResult = usersResponse.data;
        if (usersResult.success && usersResult.data) {
          const usersList = usersResult.data || [];
          setRecentUsers(Array.isArray(usersList) ? usersList.slice(0, 5) : []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getUserName = (user: any): string => {
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return user.email || "Unknown";
  };

  const getRoleBadgeStyle = (role: string): string => {
    switch (role) {
      case "GUIDE": return "bg-blue-50 text-blue-700 border-blue-200";
      case "AGENCY": return "bg-purple-50 text-purple-700 border-purple-200";
      case "ADMIN": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="ml-2.5 text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Overview of your platform</p>
        </div>
        <span className="text-xs text-gray-400">Updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}

      {/* Stats Cards Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Revenue Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-emerald-50 flex items-center justify-center">
              <FaDollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              <FaArrowUp className="w-2.5 h-2.5" />12.5%
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight break-words">PKR {stats.totalRevenue.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Total Revenue</p>
        </div>

        {/* Total Users Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-blue-50 flex items-center justify-center">
              <FaUsers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              <FaArrowUp className="w-2.5 h-2.5" />8.2%
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Total Users</p>
        </div>

        {/* Platform Visitors Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-cyan-50 flex items-center justify-center">
              <FaEye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">
              <FaArrowUp className="w-2.5 h-2.5" />Live
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{stats.totalVisitors.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Platform Visitors</p>
        </div>

        {/* Pending Verifications Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-amber-50 flex items-center justify-center">
              <FaUserClock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Needs Review</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{stats.pendingVerifications}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Pending Verifications</p>
        </div>

        {/* Open Disputes Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-md bg-red-50 flex items-center justify-center">
              <FaBell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded">Action Needed</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{stats.openDisputes}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Open Disputes</p>
        </div>
      </div>

      {/* Recent Users Table - Responsive */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent Users</h2>
          <Link href="/admin/dashboard/users" className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">View all →</Link>
        </div>
        
        {/* Mobile: Card View, Desktop: Table View */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {recentUsers.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">No users found</div>
          ) : (
            recentUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-2 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                    <img src={user.avatar ? getImageUrl(user.avatar) : "/guid-placeholder.jpg"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{getUserName(user)}</p>
                    <p className="text-xs text-gray-500 break-all">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No users found</td>
                </tr>
              ) : (
                recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                          <img src={user.avatar ? getImageUrl(user.avatar) : "/guid-placeholder.jpg"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{getUserName(user)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500 break-all">{user.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${getRoleBadgeStyle(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}