"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminGuidesPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchGuides = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getGuides({ limit: 100 });
      const result = response.data;
      if (result.success && result.data) {
        const guidesList = result.data || [];
        setGuides(Array.isArray(guidesList) ? guidesList : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load guides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGuides(); }, []);

  const handleVerify = async (guideId: string) => {
    setActionLoading(guideId);
    try {
      await adminApi.verifyGuide(guideId);
      setGuides((prev) => prev.map((g) => (g.id === guideId ? { ...g, isVerified: true } : g)));
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const handleUnverify = async (guideId: string) => {
    setActionLoading(guideId);
    try {
      await adminApi.unverifyGuide(guideId);
      setGuides((prev) => prev.map((g) => (g.id === guideId ? { ...g, isVerified: false } : g)));
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const getGuideName = (guide: any) => {
    if (guide.users?.firstName && guide.users?.lastName) {
      return `${guide.users.firstName} ${guide.users.lastName}`;
    }
    if (guide.user?.firstName && guide.user?.lastName) {
      return `${guide.user.firstName} ${guide.user.lastName}`;
    }
    return guide.email || "Unknown";
  };

  const getGuideAvatar = (guide: any) => {
    const raw = guide.users?.avatar || guide.user?.avatar || "";
    return raw ? getImageUrl(raw) : "/guid-placeholder.jpg";
  };

  const filteredGuides = guides.filter((g) => {
    const name = getGuideName(g).toLowerCase();
    const matchesSearch = search === "" || name.includes(search.toLowerCase()) || g.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = verificationFilter === "ALL" || (verificationFilter === "VERIFIED" ? g.isVerified : !g.isVerified);
    return matchesSearch && matchesFilter;
  });

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <FaStar key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}`} />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Guides</h1>
        <p className="text-sm text-gray-500 mt-0.5">Verify and manage tour guides</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input type="text" placeholder="Search guides..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
          <option value="ALL">All Guides</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Guide</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Price/Day</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredGuides.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No guides found</td></tr>
              ) : (
                filteredGuides.map((guide) => (
                  <tr key={guide.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                          <img src={getGuideAvatar(guide)} alt="" className="w-8 h-8 object-cover rounded-full"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getGuideName(guide)}</p>
                          <p className="text-xs text-gray-400">{guide.email || guide.users?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><FaMapMarkerAlt className="w-3 h-3 text-green-500" />{guide.location || "N/A"}</span>
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">Rs {(guide.pricePerDay || 0).toLocaleString()}</td>
                    <td className="px-5 py-3">{renderStars(guide.rating || 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${guide.isVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                        {guide.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {guide.isVerified ? (
                        <button onClick={() => handleUnverify(guide.id)} disabled={actionLoading === guide.id}
                          className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-100 disabled:opacity-50 flex items-center gap-1 ml-auto">
                          {actionLoading === guide.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaTimesCircle className="w-3 h-3" />}Unverify
                        </button>
                      ) : (
                        <button onClick={() => handleVerify(guide.id)} disabled={actionLoading === guide.id}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 disabled:opacity-50 flex items-center gap-1 ml-auto">
                          {actionLoading === guide.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}Verify
                        </button>
                      )}
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