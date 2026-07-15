"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaUserCheck,
  FaUserSlash,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminTravelersPage() {
  const [travelers, setTravelers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTravelers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers({ limit: 200 });
      const result = response.data;
      if (result.success && result.data) {
        const usersList = result.data || [];
        const travelersOnly = usersList.filter((u: any) => u.role === "TRAVELER");
        setTravelers(Array.isArray(travelersOnly) ? travelersOnly : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load travelers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTravelers(); }, []);

  const handleToggleStatus = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.toggleUserStatus(userId);
      setTravelers((prev) => prev.map((t) => (t.id === userId ? { ...t, isActive: !t.isActive } : t)));
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const filteredTravelers = travelers.filter((t) => {
    const name = `${t.firstName || ""} ${t.lastName || ""}`.toLowerCase();
    return search === "" || name.includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
        <span className="ml-2 text-sm text-gray-500">Loading travelers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Travelers</h1>
        <p className="text-sm text-gray-500 mt-0.5">{filteredTravelers.length} travelers</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="relative max-w-sm">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
        <input
          type="text"
          placeholder="Search travelers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Traveler</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email Verified</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTravelers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No travelers found</td>
                </tr>
              ) : (
                filteredTravelers.map((traveler) => (
                  <tr key={traveler.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                          <img
                            src={traveler.avatar ? getImageUrl(traveler.avatar) : "/guid-placeholder.jpg"}
                            alt=""
                            className="w-8 h-8 object-cover rounded-full"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {traveler.firstName || ""} {traveler.lastName || ""}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{traveler.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        traveler.isEmailVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                      }`}>
                        {traveler.isEmailVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        traveler.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {traveler.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">
                      {new Date(traveler.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(traveler.id)}
                        disabled={actionLoading === traveler.id}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ml-auto transition-colors ${
                          traveler.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {actionLoading === traveler.id ? (
                          <FaSpinner className="w-3 h-3 animate-spin" />
                        ) : traveler.isActive ? (
                          <FaUserSlash className="w-3 h-3" />
                        ) : (
                          <FaUserCheck className="w-3 h-3" />
                        )}
                        {traveler.isActive ? "Ban" : "Unban"}
                      </button>
                    </td>
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