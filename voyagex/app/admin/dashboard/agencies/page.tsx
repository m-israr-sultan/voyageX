"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaStar,
  FaMapMarkerAlt,
  FaBriefcase,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAgencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getAgencies({ limit: 100 });
      const result = response.data;
      if (result.success && result.data) {
        const agenciesList = result.data || [];
        setAgencies(Array.isArray(agenciesList) ? agenciesList : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load agencies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgencies(); }, []);

  const handleVerify = async (agencyId: string) => {
    setActionLoading(agencyId);
    try {
      await adminApi.verifyAgency(agencyId);
      setAgencies((prev) => prev.map((a) => (a.id === agencyId ? { ...a, isVerified: true } : a)));
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const handleUnverify = async (agencyId: string) => {
    setActionLoading(agencyId);
    try {
      await adminApi.unverifyAgency(agencyId);
      setAgencies((prev) => prev.map((a) => (a.id === agencyId ? { ...a, isVerified: false } : a)));
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const filteredAgencies = agencies.filter((a) => {
    const name = (a.name || "").toLowerCase();
    const matchesSearch = search === "" || name.includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = verificationFilter === "ALL" || (verificationFilter === "VERIFIED" ? a.isVerified : !a.isVerified);
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
        <h1 className="text-xl font-semibold text-gray-900">Agencies</h1>
        <p className="text-sm text-gray-500 mt-0.5">Verify and manage travel agencies</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input type="text" placeholder="Search agencies..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        <select value={verificationFilter} onChange={(e) => setVerificationFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
          <option value="ALL">All Agencies</option>
          <option value="VERIFIED">Verified</option>
          <option value="UNVERIFIED">Unverified</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Mobile cards */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {filteredAgencies.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">No agencies found</div>
          ) : (
            filteredAgencies.map((agency) => (
              <div key={agency.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                    <img src={agency.logo ? getImageUrl(agency.logo) : "/agency-placeholder.jpg"} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{agency.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500 break-all">{agency.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FaMapMarkerAlt className="w-3 h-3 text-green-500" />{agency.city || agency.country || "N/A"}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <FaBriefcase className="w-3 h-3 text-purple-500" />{agency._count?.packages || 0}
                  </span>
                  {renderStars(agency.rating || 0)}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${agency.isVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                    {agency.isVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
                {agency.isVerified ? (
                  <button onClick={() => handleUnverify(agency.id)} disabled={actionLoading === agency.id}
                    className="w-full px-3 py-2 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1">
                    {actionLoading === agency.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaTimesCircle className="w-3 h-3" />}Unverify
                  </button>
                ) : (
                  <button onClick={() => handleVerify(agency.id)} disabled={actionLoading === agency.id}
                    className="w-full px-3 py-2 bg-green-50 text-green-700 rounded-md text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1">
                    {actionLoading === agency.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}Verify
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Agency</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Packages</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAgencies.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No agencies found</td></tr>
              ) : (
                filteredAgencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                          <img src={agency.logo ? getImageUrl(agency.logo) : "/agency-placeholder.jpg"} alt="" className="w-8 h-8 object-cover rounded-full" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{agency.name || "Unknown"}</p>
                          <p className="text-xs text-gray-400 break-all">{agency.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><FaMapMarkerAlt className="w-3 h-3 text-green-500" />{agency.city || agency.country || "N/A"}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><FaBriefcase className="w-3 h-3 text-purple-500" />{agency._count?.packages || 0}</span>
                    </td>
                    <td className="px-5 py-3">{renderStars(agency.rating || 0)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${agency.isVerified ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                        {agency.isVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {agency.isVerified ? (
                        <button onClick={() => handleUnverify(agency.id)} disabled={actionLoading === agency.id}
                          className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-xs font-medium hover:bg-yellow-100 disabled:opacity-50 flex items-center gap-1 ml-auto">
                          {actionLoading === agency.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaTimesCircle className="w-3 h-3" />}Unverify
                        </button>
                      ) : (
                        <button onClick={() => handleVerify(agency.id)} disabled={actionLoading === agency.id}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100 disabled:opacity-50 flex items-center gap-1 ml-auto">
                          {actionLoading === agency.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}Verify
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