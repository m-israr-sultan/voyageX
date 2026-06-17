"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaSave, 
  FaTimes, 
  FaCamera, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaCheckCircle,
  FaExclamationTriangle 
} from "react-icons/fa";
import { usersApi, uploadApi } from "@/lib/api";
import { compressAvatar } from "@/lib/imageCompression";

const BASE = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
const resolveUrl = (path: string) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${BASE}/${path}`;
};

export default function TravelerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [formData, setFormData] = useState({ 
    firstName: "", 
    lastName: "", 
    phone: "", 
    avatar: "" 
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

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
        const avatarUrl = data.avatar ? resolveUrl(data.avatar) : "";
        setFormData({ 
          firstName: data.firstName || "", 
          lastName: data.lastName || "", 
          phone: data.phone || "", 
          avatar: avatarUrl 
        });
        setAvatarPreview(avatarUrl || null);
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessageType("error");
      setMessage("Image size should be less than 5MB");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    // Preview immediately before compression
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    // Compress before upload — keeps upload under 300 KB on slow connections
    let fileToUpload = file;
    try { fileToUpload = await compressAvatar(file); } catch { /* use original on error */ }

    const uploadFormData = new FormData();
    uploadFormData.append("file", fileToUpload);
    try {
      const response = await uploadApi.uploadImage(uploadFormData);
      const result = response.data;
      const path = result?.data?.path || result?.path || "";
      const url = path ? `${process.env.NEXT_PUBLIC_UPLOAD_URL || "http://localhost:8000"}/${path}` : "";
      setFormData((prev) => ({ ...prev, avatar: url }));
      setMessageType("success");
      setMessage("Avatar uploaded successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setMessageType("error");
      setMessage("Failed to upload avatar");
      setAvatarPreview(formData.avatar || null);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      setMessageType("error");
      setMessage("First name is required");
      return false;
    }
    if (!formData.lastName.trim()) {
      setMessageType("error");
      setMessage("Last name is required");
      return false;
    }
    if (formData.phone && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone)) {
      setMessageType("error");
      setMessage("Please enter a valid phone number");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    setMessage("");
    try {
      const response = await usersApi.updateProfile({ 
        firstName: formData.firstName, 
        lastName: formData.lastName, 
        phone: formData.phone, 
        avatar: formData.avatar 
      });
      const result = response.data;
      if (result.success) {
        await fetchProfile();
        setEditing(false);
        setMessageType("success");
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessageType("error");
        setMessage(result.message || "Failed to update profile");
      }
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse"></div>
          <div className="h-9 w-16 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-3"></div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your personal information</p>
        </div>
        {!editing ? (
          <button 
            onClick={() => setEditing(true)} 
            className="w-full sm:w-auto px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm hover:bg-[#006816] transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => {
              setEditing(false);
              // Reset form data to original profile
              setFormData({
                firstName: profile?.firstName || "",
                lastName: profile?.lastName || "",
                phone: profile?.phone || "",
                avatar: profile?.avatar || ""
              });
              setAvatarPreview(profile?.avatar || null);
              setMessage("");
            }} 
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <FaTimes className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          messageType === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {message}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-6 sm:py-8 border-b border-gray-100 bg-gray-50/30">
          <div className="relative">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md">
              <img 
                src={avatarPreview || formData.avatar || "/guid-placeholder.jpg"} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }}
              />
            </div>
            {editing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#008A1E] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#006816] transition-colors shadow-md">
                <FaCamera className="w-4 h-4 text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {editing ? "Click camera icon to change photo" : "Your profile photo"}
          </p>
        </div>

        {/* Profile Info */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                First Name
              </label>
              {editing ? (
                <input 
                  type="text" 
                  value={formData.firstName} 
                  onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  placeholder="Enter first name"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {profile?.firstName || "—"}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Last Name
              </label>
              {editing ? (
                <input 
                  type="text" 
                  value={formData.lastName} 
                  onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  placeholder="Enter last name"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  {profile?.lastName || "—"}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              <FaEnvelope className="inline w-3 h-3 mr-1" /> Email Address
            </label>
            <p className="text-sm font-medium text-gray-900">
              {profile?.email || "—"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Email cannot be changed. Contact support for assistance.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              <FaPhone className="inline w-3 h-3 mr-1" /> Phone Number
            </label>
            {editing ? (
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                placeholder="+92 300 1234567"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {profile?.phone || "—"}
              </p>
            )}
          </div>

          {/* Account Status */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Account Status</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <FaCheckCircle className="w-3 h-3" /> Active
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Member Since</span>
              <span className="text-xs text-gray-700">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {editing && (
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30">
            <button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full py-2.5 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><FaSpinner className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><FaSave className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}