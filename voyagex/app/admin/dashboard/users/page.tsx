"use client";

import { useState, useEffect } from "react";
import {
  FaSearch,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaUserCheck,
  FaUserSlash,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getUsers({ limit: 100 });
      const result = response.data;
      if (result.success && result.data) {
        const usersList = result.data || [];
        setUsers(Array.isArray(usersList) ? usersList : []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminApi.toggleUserStatus(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)));
    } catch (err: any) { console.error("Failed:", err); }
    finally { setActionLoading(null); }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = search === "" ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-red-50 text-red-700 border-red-200",
      GUIDE: "bg-blue-50 text-blue-700 border-blue-200",
      AGENCY: "bg-purple-50 text-purple-700 border-purple-200",
      TRAVELER: "bg-green-50 text-green-700 border-green-200",
    };
    return `px-2 py-0.5 rounded text-xs font-medium border ${styles[role] || "bg-gray-50 text-gray-600 border-gray-200"}`;
  };

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
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all platform users</p>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10">
          <option value="ALL">All Roles</option>
          <option value="TRAVELER">Traveler</option>
          <option value="GUIDE">Guide</option>
          <option value="AGENCY">Agency</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No users found</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                          <img src={user.avatar ? getImageUrl(user.avatar) : "/guid-placeholder.jpg"} alt="" className="w-8 h-8 object-cover rounded-full" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="px-5 py-3"><span className={getRoleBadge(user.role)}>{user.role}</span></td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {user.isActive ? "Active" : "Banned"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleToggleStatus(user.id)} disabled={actionLoading === user.id || user.role === "ADMIN"}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 ml-auto ${user.isActive ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"} disabled:opacity-50`}>
                        {actionLoading === user.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : user.isActive ? <FaUserSlash className="w-3 h-3" /> : <FaUserCheck className="w-3 h-3" />}
                        {user.isActive ? "Ban" : "Unban"}
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