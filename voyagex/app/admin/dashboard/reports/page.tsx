"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaFilter,
} from "react-icons/fa";
import { adminApi } from "../../../../lib/api";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getReports({ page, limit: 10 });
      const result = response.data;
      if (result.success && result.data) {
        const reportsList = result.data.reports || [];
        setReports(reportsList);
        setPagination(result.data.pagination || { total: reportsList.length, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    setActionLoading(reportId);
    try {
      await adminApi.updateReportStatus(reportId, status);
      setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status } : r)));
    } catch (err: any) { console.error("Failed to update report:", err); }
    finally { setActionLoading(null); }
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch = search === "" || r.title?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-300",
      REVIEWING: "bg-blue-500/20 text-blue-300",
      RESOLVED: "bg-green-500/20 text-green-300",
      DISMISSED: "bg-red-500/20 text-red-300",
    };
    const icons: Record<string, any> = {
      PENDING: FaClock,
      REVIEWING: FaSearch,
      RESOLVED: FaCheckCircle,
      DISMISSED: FaTimesCircle,
    };
    const Icon = icons[status] || FaExclamationTriangle;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || "bg-gray-500/20 text-gray-300"}`}>
        <Icon className="w-3 h-3" />{status || "PENDING"}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      GUIDE: "bg-blue-500/20 text-blue-300",
      AGENCY: "bg-purple-500/20 text-purple-300",
      PACKAGE: "bg-green-500/20 text-green-300",
      SCAM: "bg-red-500/20 text-red-300",
      SAFETY: "bg-orange-500/20 text-orange-300",
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || "bg-gray-500/20 text-gray-300"}`}>{type || "OTHER"}</span>;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/Home.png')" }} />
        <div className="fixed inset-0 bg-black/60" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <FaSpinner className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/Home.png')" }} />
      <div className="fixed inset-0 bg-black/60" />

      <div className="relative z-10 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-white/70 mt-1">Review and manage user reports</p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 text-red-200 rounded-lg text-sm">{error}</div>
        )}

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
              <input type="text" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="ALL" className="bg-gray-800">All Status</option>
              <option value="PENDING" className="bg-gray-800">Pending</option>
              <option value="REVIEWING" className="bg-gray-800">Reviewing</option>
              <option value="RESOLVED" className="bg-gray-800">Resolved</option>
              <option value="DISMISSED" className="bg-gray-800">Dismissed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
              <FaExclamationTriangle className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No reports found</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div key={report.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeBadge(report.type)}
                      {getStatusBadge(report.status)}
                      <span className="text-white/40 text-xs">{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{report.title}</h3>
                    <p className="text-white/60 text-sm">{report.description}</p>
                    {report.reporter && (
                      <p className="text-white/40 text-xs mt-2">Reported by: {report.reporter.firstName} {report.reporter.lastName} ({report.reporter.email})</p>
                    )}
                  </div>
                  {report.status !== "RESOLVED" && report.status !== "DISMISSED" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleUpdateStatus(report.id, "RESOLVED")} disabled={actionLoading === report.id}
                        className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm font-medium hover:bg-green-500/30 disabled:opacity-50 flex items-center gap-1">
                        {actionLoading === report.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}Resolve
                      </button>
                      <button onClick={() => handleUpdateStatus(report.id, "DISMISSED")} disabled={actionLoading === report.id}
                        className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-medium hover:bg-red-500/30 disabled:opacity-50 flex items-center gap-1">
                        {actionLoading === report.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaTimesCircle className="w-3 h-3" />}Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
            <span className="text-white/50 text-sm">Showing {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span>
            <div className="flex gap-2">
              <button onClick={() => fetchReports(pagination.page - 1)} disabled={pagination.page <= 1}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-30 hover:bg-white/20"><FaChevronLeft className="w-3 h-3" /></button>
              <button onClick={() => fetchReports(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white disabled:opacity-30 hover:bg-white/20"><FaChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}