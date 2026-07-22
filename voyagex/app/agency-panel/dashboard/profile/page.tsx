"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaSpinner,
  FaSave,
  FaTimes,
  FaCamera,
  FaStar,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUser,
  FaMapMarkerAlt,
  FaGlobe,
  FaPhone,
  FaEnvelope,
  FaEdit,
} from "react-icons/fa";
import { agenciesApi, uploadApi } from "@/lib/api";
import { compressAvatar, compressGalleryImage } from "@/lib/imageCompression";
import { extractUploadPath, getImageUrl } from "@/lib/image-utils";

const NORTHERN_REGIONS: { value: string; label: string }[] = [
  { value: "HUNZA",         label: "Hunza Valley" },
  { value: "SKARDU",        label: "Skardu" },
  { value: "GILGIT",        label: "Gilgit" },
  { value: "NAGAR",         label: "Nagar" },
  { value: "GHIZER",        label: "Ghizer" },
  { value: "SWAT",          label: "Swat" },
  { value: "KALAM",         label: "Kalam" },
  { value: "CHITRAL",       label: "Chitral" },
  { value: "NARAN",         label: "Naran" },
  { value: "KAGHAN",        label: "Kaghan" },
  { value: "MURREE",        label: "Murree" },
  { value: "ABBOTTABAD",    label: "Abbottabad" },
  { value: "NEELUM_VALLEY", label: "Neelum Valley" },
  { value: "MUZAFFARABAD",  label: "Muzaffarabad" },
  { value: "RAWALAKOT",     label: "Rawalakot" },
];

function getRegionLabel(value: string): string {
  return NORTHERN_REGIONS.find((r) => r.value === value)?.label ?? value ?? "—";
}

export default function AgencyProfilePage() {
  const [profile, setProfile]               = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [editing, setEditing]               = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [message, setMessage]               = useState("");
  const [messageType, setMessageType]       = useState<"success" | "error" | "info">("success");
  const [error, setError]                   = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | number | null>(null);
  const [galleryImages, setGalleryImages]   = useState<string[]>([]);

  // Separate refs for cover and logo file inputs so we can trigger them programmatically
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef  = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name:        "",
    description: "",
    city:        "",
    country:     "",
    website:     "",
    address:     "",
    logo:        "",
    coverImage:  "",
    region:      "",
  });

  useEffect(() => { fetchProfile(); }, []);

  // ─── helpers ────────────────────────────────────────────────────────────────

  const showMsg = (type: "success" | "error" | "info", text: string, ms = 3000) => {
    setMessageType(type);
    setMessage(text);
    if (ms > 0) setTimeout(() => setMessage(""), ms);
  };

  // ─── data fetch ─────────────────────────────────────────────────────────────

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agenciesApi.getMyProfile();
      const result   = response.data;
      const data     = result?.success !== undefined ? result.data : result;

      if (!data) { setProfile(null); return; }

      setProfile(data);
      setFormData({
        name:        data.name        ?? "",
        description: data.description ?? "",
        city:        data.city        ?? "",
        country:     data.country     ?? "",
        website:     data.website     ?? "",
        address:     data.address     ?? "",
        logo:        data.logo        ?? "",
        coverImage:  data.coverImage  ?? "",
        region:      data.region      ?? "",
      });
      setGalleryImages(
        Array.isArray(data.galleryImages) ? data.galleryImages : []
      );
    } catch (err: any) {
      if (err.response?.status === 404) setProfile(null);
      else setError(err.response?.data?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  // ─── image upload ────────────────────────────────────────────────────────────

  const uploadFile = async (file: File, type: "avatar" | "gallery" = "gallery"): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error("Image size should be less than 5MB");
    const compressed = type === "avatar" ? await compressAvatar(file) : await compressGalleryImage(file);
    const fd = new FormData();
    fd.append("file", compressed);
    const response = await uploadApi.uploadImage(fd);
    const path = extractUploadPath(response.data);
    if (!path) throw new Error("Upload returned no path");
    return path;
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage("cover");
    showMsg("info", "Uploading cover image…", 0);
    try {
      const url = await uploadFile(file, "gallery");
      setFormData((prev) => ({ ...prev, coverImage: url }));
      showMsg("success", "Cover image uploaded!", 2000);
    } catch (err: any) {
      showMsg("error", err.message ?? "Failed to upload cover image");
    } finally {
      setUploadingImage(null);
      e.target.value = "";
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage("logo");
    showMsg("info", "Uploading logo…", 0);
    try {
      const url = await uploadFile(file, "avatar");
      setFormData((prev) => ({ ...prev, logo: url }));
      showMsg("success", "Logo uploaded!", 2000);
    } catch (err: any) {
      showMsg("error", err.message ?? "Failed to upload logo");
    } finally {
      setUploadingImage(null);
      e.target.value = "";
    }
  };

  const handleGalleryImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(index);
    try {
      const url = await uploadFile(file);
      setGalleryImages((prev) => {
        const next = [...prev];
        next[index] = url;
        return next;
      });
      showMsg("success", "Gallery image uploaded!", 2000);
    } catch (err: any) {
      showMsg("error", err.message ?? "Failed to upload image");
    } finally {
      setUploadingImage(null);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => {
      const next = [...prev];
      next[index] = "";
      return next;
    });
  };

  // ─── validation + save ───────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    if (!formData.name.trim())    { showMsg("error", "Agency name is required");   return false; }
    if (!formData.city.trim())    { showMsg("error", "City is required");           return false; }
    if (!formData.country.trim()) { showMsg("error", "Country is required");        return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        name:          formData.name,
        description:   formData.description,
        city:          formData.city,
        country:       formData.country,
        website:       formData.website,
        address:       formData.address,
        logo:          formData.logo,
        coverImage:    formData.coverImage,
        galleryImages: galleryImages.filter(Boolean),
        ...(formData.region && { region: formData.region }),
      };

      const response = await agenciesApi.updateMyProfile(payload);
      const result   = response.data;

      if (result.success || result.data) {
        showMsg("success", "Profile updated successfully!", 3000);
        await fetchProfile();
        setEditing(false);
      } else {
        showMsg("error", result.message ?? "Failed to update profile", 5000);
      }
    } catch (err: any) {
      showMsg("error", err.response?.data?.message ?? "Failed to update profile", 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name:        profile.name        ?? "",
        description: profile.description ?? "",
        city:        profile.city        ?? "",
        country:     profile.country     ?? "",
        website:     profile.website     ?? "",
        address:     profile.address     ?? "",
        logo:        profile.logo        ?? "",
        coverImage:  profile.coverImage  ?? "",
        region:      profile.region      ?? "",
      });
      setGalleryImages(
        Array.isArray(profile.galleryImages) ? profile.galleryImages : []
      );
    }
    setEditing(false);
    setMessage("");
  };

  // ─── loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-4xl mx-auto">
        <div className="flex justify-between items-center">
          <div className="h-7 bg-gray-200 rounded-lg w-40 animate-pulse" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="h-48 bg-gray-200 rounded-lg mb-4 animate-pulse" />
          <div className="flex items-end gap-4 -mt-12 ml-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <div className="h-3 w-16 bg-gray-100 rounded mb-1 animate-pulse" />
                <div className="h-5 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── error state ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-4xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agency Profile</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FaExclamationTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800">Unable to load profile</h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button onClick={fetchProfile} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── new agency — no profile yet ─────────────────────────────────────────────

  if (!profile && !editing) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FaUser className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Agency Profile</h2>
          <p className="text-gray-500 mb-6 max-w-sm">Fill in your agency details to start receiving bookings from travellers.</p>
          <button onClick={() => setEditing(true)} className="px-6 py-3 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors font-medium">
            Start Profile Setup →
          </button>
        </div>
      </div>
    );
  }

  // ─── main view ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Agency Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your agency information</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full sm:w-auto px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm hover:bg-[#006816] flex items-center justify-center gap-2 transition-colors"
          >
            <FaEdit className="w-3 h-3" /> Edit Profile
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
          >
            <FaTimes className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>

      {/* Status message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          messageType === "success" ? "bg-green-100 text-green-700"
          : messageType === "error" ? "bg-red-100 text-red-700"
          : "bg-blue-100 text-blue-700"
        }`}>
          {messageType === "success" && <FaCheckCircle className="w-4 h-4 flex-shrink-0" />}
          {messageType === "error"   && <FaExclamationTriangle className="w-4 h-4 flex-shrink-0" />}
          {messageType === "info"    && <FaSpinner className="w-4 h-4 flex-shrink-0 animate-spin" />}
          {message}
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* ── Cover Image ── */}
        {/* Hidden file inputs — triggered programmatically to ensure full-area click works */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />

        <div
          className={`relative h-32 sm:h-40 md:h-48 lg:h-56 bg-gray-200 ${editing ? "cursor-pointer group" : ""}`}
          onClick={() => editing && coverInputRef.current?.click()}
        >
          {formData.coverImage ? (
            <img
              src={getImageUrl(formData.coverImage)}
              alt="Agency cover"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center text-gray-400">
                <FaCamera className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">{editing ? "Click to upload cover image" : "No cover image"}</p>
              </div>
            </div>
          )}
          {/* Hover overlay — only shows in edit mode */}
          {editing && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center text-white gap-2">
                {uploadingImage === "cover" ? (
                  <FaSpinner className="w-8 h-8 animate-spin" />
                ) : (
                  <>
                    <FaCamera className="w-8 h-8" />
                    <span className="text-sm font-medium">Change Cover Photo</span>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Small badge for non-hover users on mobile */}
          {editing && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1 pointer-events-none">
              <FaCamera className="w-3 h-3" />
              {uploadingImage === "cover" ? "Uploading…" : "Click to change"}
            </div>
          )}
        </div>

        {/* ── Logo / Avatar ── */}
        <div className="relative px-4 sm:px-6">
          <div
            className={`relative -mt-12 sm:-mt-16 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white bg-gray-200 shadow-md ${editing ? "cursor-pointer group" : ""}`}
            onClick={() => editing && logoInputRef.current?.click()}
          >
            {formData.logo ? (
              <img
                src={getImageUrl(formData.logo)}
                alt="Agency logo"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <FaUser className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {/* Hover overlay for logo */}
            {editing && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all rounded-full flex items-center justify-center pointer-events-none">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white flex flex-col items-center">
                  {uploadingImage === "logo" ? (
                    <FaSpinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <FaCamera className="w-5 h-5" />
                  )}
                </div>
              </div>
            )}
            {/* Camera badge */}
            {editing && (
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#008A1E] rounded-full flex items-center justify-center shadow-md pointer-events-none">
                {uploadingImage === "logo"
                  ? <FaSpinner className="w-3 h-3 text-white animate-spin" />
                  : <FaCamera className="w-3 h-3 text-white" />
                }
              </div>
            )}
          </div>
        </div>

        {/* ── Fields ── */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

            {/* Agency Name */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Agency Name *</label>
              {editing ? (
                <input
                  type="text" value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  placeholder="e.g. Northern Adventures"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile?.name || "—"}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                <FaEnvelope className="w-3 h-3" /> Email
              </label>
              <p className="text-sm font-medium text-gray-900">{profile?.users?.email || "—"}</p>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">City *</label>
              {editing ? (
                <input
                  type="text" value={formData.city}
                  onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  placeholder="e.g. Karimabad, Gilgit"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <FaMapMarkerAlt className="w-3 h-3 text-[#008A1E]" />
                  {profile?.city || "—"}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Country *</label>
              {editing ? (
                <input
                  type="text" value={formData.country}
                  onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  placeholder="e.g. Pakistan"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile?.country || "—"}</p>
              )}
            </div>

            {/* Region */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Region (Northern Areas)</label>
              {editing ? (
                <select
                  value={formData.region}
                  onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] bg-white"
                >
                  <option value="">Select Region</option>
                  {NORTHERN_REGIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <FaMapMarkerAlt className="w-3 h-3 text-[#008A1E]" />
                  {profile?.region ? getRegionLabel(profile.region) : "—"}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Address</label>
              {editing ? (
                <input
                  type="text" value={formData.address}
                  onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  placeholder="Street / building / area"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900">{profile?.address || "—"}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              {editing ? (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] resize-y"
                  placeholder="Tell travellers about your agency, services, and what makes you special…"
                />
              ) : (
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {profile?.description || "—"}
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
                <FaGlobe className="w-3 h-3" /> Website
              </label>
              {editing ? (
                <input
                  type="text" value={formData.website}
                  onChange={(e) => setFormData((p) => ({ ...p, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  placeholder="https://yourwebsite.com"
                />
              ) : profile?.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-[#008A1E] hover:underline break-all">
                  {profile.website}
                </a>
              ) : (
                <p className="text-sm font-medium text-gray-900">—</p>
              )}
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rating</label>
              <p className="text-sm font-medium flex items-center gap-1">
                <FaStar className="text-yellow-500 w-3 h-3" />
                {profile?.rating ?? 0} ({profile?.totalReviews ?? 0} reviews)
              </p>
            </div>

            {/* Verified */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Verification Status</label>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                profile?.isVerified
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {profile?.isVerified
                  ? <><FaCheckCircle className="w-3 h-3" /> Verified Agency</>
                  : "⏳ Pending Verification"
                }
              </span>
            </div>

          </div>

          {/* ── Gallery — Edit Mode ── */}
          {editing && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Gallery Images (Portfolio)
                </label>
                <span className="text-xs text-gray-400">
                  {galleryImages.filter(Boolean).length} / 6 uploaded
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="relative group">
                    {galleryImages[index] ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={getImageUrl(galleryImages[index])}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-3 py-2 bg-white text-gray-800 rounded-lg text-xs cursor-pointer hover:bg-gray-100 flex items-center gap-1">
                            <FaCamera className="w-3 h-3" /> Change
                            <input type="file" accept="image/*"
                              onChange={(e) => handleGalleryImageUpload(e, index)} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 flex items-center gap-1"
                          >
                            <FaTrash className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#008A1E] transition-colors bg-gray-50 group">
                        {uploadingImage === index ? (
                          <>
                            <FaSpinner className="w-7 h-7 text-[#008A1E] animate-spin mb-2" />
                            <span className="text-xs text-gray-500">Uploading…</span>
                          </>
                        ) : (
                          <>
                            <FaCamera className="w-7 h-7 text-gray-300 group-hover:text-[#008A1E] mb-2 transition-colors" />
                            <span className="text-xs text-gray-400 group-hover:text-[#008A1E] transition-colors">
                              Upload Image {index + 1}
                            </span>
                          </>
                        )}
                        <input type="file" accept="image/*"
                          onChange={(e) => handleGalleryImageUpload(e, index)}
                          className="hidden"
                          disabled={uploadingImage !== null}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Max 5 MB per image · JPG, PNG, WebP supported</p>
            </div>
          )}

          {/* ── Gallery — View Mode ── */}
          {!editing && galleryImages.filter(Boolean).length > 0 && (
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Gallery</label>
              <div className="grid grid-cols-1 min-[375px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryImages.filter(Boolean).map((img, idx) => {
                  const resolvedImg = getImageUrl(img);
                  return (
                    <div key={idx}
                      className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => window.open(resolvedImg, "_blank")}
                    >
                      <img
                        src={resolvedImg}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          {editing && (
            <button
              onClick={handleSave}
              disabled={saving || uploadingImage !== null}
              className="w-full mt-8 py-3 bg-[#008A1E] text-white rounded-lg font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {saving
                ? <><FaSpinner className="w-4 h-4 animate-spin" /> Saving…</>
                : <><FaSave className="w-4 h-4" /> Save Changes</>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}