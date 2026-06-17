"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaSpinner, 
  FaLock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUser,
  FaEnvelope,
  FaShieldAlt,
  FaTrashAlt,
  FaBuilding,
  FaInfoCircle,
} from "react-icons/fa";
import { usersApi, authApi } from "@/lib/api";
import { clearAuth } from "@/lib/auth";

export default function AgencySettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("success");
  const [passwords, setPasswords] = useState({ 
    current: "", 
    newPassword: "", 
    confirm: "" 
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await usersApi.getProfile();
      const result = response.data;
      if (result.success && result.data) {
        const data = result.data.user || result.data;
        setProfile(data);
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setMessageType("error");
      setMessage("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwords.current || !passwords.newPassword || !passwords.confirm) {
      setMessageType("error");
      setMessage("All fields are required");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      setMessageType("error");
      setMessage("New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 8) {
      setMessageType("error");
      setMessage("Password must be at least 8 characters");
      return;
    }
    if (passwords.newPassword === passwords.current) {
      setMessageType("error");
      setMessage("New password must be different from current password");
      return;
    }

    setPasswordLoading(true);
    setMessage("");
    
    try {
      await usersApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.newPassword
      });
      
      setMessageType("success");
      setMessage("Password changed successfully!");
      setPasswords({ current: "", newPassword: "", confirm: "" });
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      console.error("Error changing password:", err);
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessageType("error");
      setMessage('Type "DELETE" to confirm account deletion');
      return;
    }

    setDeleteLoading(true);
    setMessage("");
    
    try {
      await usersApi.deleteAccount();
      clearAuth();
      router.push("/login");
    } catch (err: any) {
      console.error("Error deleting account:", err);
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to delete account");
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-xl mx-auto">
        <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse"></div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-100 rounded w-48 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your agency account security</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          messageType === "success" ? "bg-green-100 text-green-700" : 
          messageType === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
        }`}>
          {messageType === "success" && <FaCheckCircle className="w-4 h-4" />}
          {messageType === "error" && <FaExclamationTriangle className="w-4 h-4" />}
          {messageType === "info" && <FaInfoCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* Change Password Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaLock className="w-4 h-4 text-[#008A1E]" /> Change Password
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input 
              type="password" 
              value={passwords.current} 
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input 
              type="password" 
              value={passwords.newPassword} 
              onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input 
              type="password" 
              value={passwords.confirm} 
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} 
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
              placeholder="Confirm new password"
            />
          </div>
          
          <button 
            onClick={handleChangePassword} 
            disabled={passwordLoading} 
            className="w-full py-2.5 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {passwordLoading ? (
              <><FaSpinner className="w-4 h-4 animate-spin" /> Changing...</>
            ) : (
              <><FaCheckCircle className="w-4 h-4" /> Change Password</>
            )}
          </button>
        </div>
      </div>

      {/* Account Information Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-sm">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaBuilding className="w-4 h-4 text-[#008A1E]" /> Account Information
        </h2>
        
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email Address</span>
            <span className="text-sm font-medium text-gray-900 break-all">{profile?.email || "—"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Account Type</span>
            <span className="text-sm font-medium text-gray-900">{profile?.role || "Agency"}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Member Since</span>
            <span className="text-sm font-medium text-gray-900">
              {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between py-2">
            <span className="text-sm text-gray-500">Account Status</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
              <FaCheckCircle className="w-3 h-3" /> Active
            </span>
          </div>
        </div>
      </div>

      {/* Security Tips */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaShieldAlt className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Security Tips</h4>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Use a strong password with at least 8 characters</li>
              <li>• Include uppercase, lowercase, numbers, and special characters</li>
              <li>• Never share your password with anyone</li>
              <li>• Enable two-factor authentication for extra security (coming soon)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Danger Zone - Delete Account */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-5 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
          <FaExclamationTriangle className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-sm text-red-700 mb-4">
          Once you delete your account, there is no going back. All your packages, bookings, and agency data will be permanently removed.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaTrashAlt className="w-4 h-4" /> Delete Agency Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-700">
              Type <strong className="text-red-800">DELETE</strong> to confirm account deletion:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE here"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaTrashAlt className="w-4 h-4" />}
                Permanently Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}