"use client";

import { useState, useEffect } from "react";
import {
  FaSpinner,
  FaSave,
  FaCamera,
  FaUser,
  FaEnvelope,
} from "react-icons/fa";
import { usersApi, uploadApi } from "@/lib/api";
import { getUser, saveAuth, getToken, getRefreshToken } from "@/lib/auth";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    avatar: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await usersApi.getProfile();
      const result = response.data;
      if (result.success && result.data) {
        const userData = result.data.user || result.data;
        setProfile(userData);
        setFormData({
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          phone: userData.phone || "",
          avatar: userData.avatar || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    try {
      const response = await uploadApi.uploadImage(uploadFormData);
      const result = response.data;
      const path = result?.data?.path || result?.path || "";
      const url = path
        ? `${process.env.NEXT_PUBLIC_UPLOAD_URL || "http://localhost:8000"}/${path}`
        : "";
      setFormData((prev) => ({ ...prev, avatar: url }));
    } catch (err) {
      console.error("Error uploading avatar:", err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await usersApi.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        avatar: formData.avatar,
      });
      const result = response.data;
      if (result.success) {
        const userData = getUser();
        if (userData) {
          const updatedUser = { ...userData, ...formData };
          const token = getToken();
          const refreshToken = getRefreshToken();
          if (token && refreshToken) saveAuth(token, refreshToken, updatedUser);
        }
        setProfile((prev: any) => ({ ...prev, ...formData }));
        setEditing(false);
        setMessage("Profile updated! Refreshing...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-[#008A1E] text-white rounded-md text-sm hover:bg-[#006816]"
          >
            Edit
          </button>
        ) : (
          <button
            onClick={() => setEditing(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${message.includes("updated") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-3">
            <img
              src={formData.avatar || "/guid-placeholder.jpg"}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
            {editing && (
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#008A1E] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#006816]">
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
          <p className="text-sm text-gray-500">Admin</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, firstName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                />
              ) : (
                <p className="text-sm font-medium">
                  {profile?.firstName || "—"}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, lastName: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                />
              ) : (
                <p className="text-sm font-medium">
                  {profile?.lastName || "—"}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <p className="text-sm font-medium">{profile?.email || "—"}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            {editing ? (
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, phone: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
              />
            ) : (
              <p className="text-sm font-medium">{profile?.phone || "—"}</p>
            )}
          </div>
        </div>

        {editing && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-6 py-2.5 bg-[#008A1E] text-white rounded-md text-sm font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <FaSpinner className="w-4 h-4 animate-spin" />
            ) : (
              <FaSave className="w-4 h-4" />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>
    </div>
  );
}
