"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaSave, 
  FaTimes, 
  FaCamera, 
  FaStar, 
  FaTrash, 
  FaPlus,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUser,  // ADD THIS LINE
} from "react-icons/fa";
import { guidesApi, uploadApi, usersApi } from "@/lib/api";
import { compressAvatar, compressGalleryImage } from "@/lib/imageCompression";
import { extractUploadPath, getImageUrl } from "@/lib/image-utils";

export default function GuideProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("success");
  const [error, setError] = useState<string | null>(null);
  
  // Tag states
  const [languagesTags, setLanguagesTags] = useState<string[]>([]);
  const [specialitiesTags, setSpecialitiesTags] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState("");
  const [specialityInput, setSpecialityInput] = useState("");
  
  // Destination images
  const [destinationImages, setDestinationImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    bio: "", location: "", region: "", 
    experience: "", pricePerDay: "", coverImage: "", avatar: "",
  });

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await guidesApi.getMyProfile();
      const result = response.data;
      if (result.success && result.data) {
        const data = result.data;
        setProfile(data);
        setFormData({
          bio: data.bio || "", location: data.location || "", region: data.region || "",
          experience: data.experience?.toString() || "", pricePerDay: data.pricePerDay?.toString() || "",
          coverImage: data.coverImage || "", avatar: data.users?.avatar || "",
        });
        
        setLanguagesTags(data.languages || []);
        setSpecialitiesTags(data.specialities || []);
        setDestinationImages(data.destinationImages || ["", "", ""]);
      } else {
        console.log("Profile not found, please complete your profile");
      }
    } catch (err: any) { 
      console.error("Error fetching profile:", err);
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || "Failed to load profile");
      }
    } finally { 
      setLoading(false); 
    }
  };

  const addLanguageTag = () => {
    const trimmed = languageInput.trim();
    if (trimmed && !languagesTags.includes(trimmed)) {
      setLanguagesTags([...languagesTags, trimmed]);
      setLanguageInput("");
    } else if (trimmed && languagesTags.includes(trimmed)) {
      setMessageType("error");
      setMessage("This language already exists!");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const removeLanguageTag = (tagToRemove: string) => {
    setLanguagesTags(languagesTags.filter(tag => tag !== tagToRemove));
  };

  const addSpecialityTag = () => {
    const trimmed = specialityInput.trim();
    if (trimmed && !specialitiesTags.includes(trimmed)) {
      setSpecialitiesTags([...specialitiesTags, trimmed]);
      setSpecialityInput("");
    } else if (trimmed && specialitiesTags.includes(trimmed)) {
      setMessageType("error");
      setMessage("This speciality already exists!");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const removeSpecialityTag = (tagToRemove: string) => {
    setSpecialitiesTags(specialitiesTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent, type: "language" | "speciality") => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (type === "language") addLanguageTag();
      else addSpecialityTag();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "avatar" | "coverImage") => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setMessageType("error");
      setMessage("Image size should be less than 5MB");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    const compressed = await compressAvatar(file);
    const uploadFormData = new FormData();
    uploadFormData.append("file", compressed);
    try {
      const response = await uploadApi.uploadImage(uploadFormData);
      const path = extractUploadPath(response.data);
      if (!path) {
        setMessageType("error");
        setMessage("Upload succeeded but no image path was returned");
        setTimeout(() => setMessage(""), 3000);
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: path }));
      setMessageType("success");
      setMessage(`${field === "avatar" ? "Avatar" : "Cover image"} uploaded successfully!`);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Error uploading image:", err);
      setMessageType("error");
      setMessage("Failed to upload image");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDestinationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessageType("error");
      setMessage("Image size should be less than 5MB");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setUploadingImage(index);
    const compressed = await compressGalleryImage(file);
    const uploadFormData = new FormData();
    uploadFormData.append("file", compressed);
    try {
      const response = await uploadApi.uploadImage(uploadFormData);
      const path = extractUploadPath(response.data);
      if (!path) {
        setMessageType("error");
        setMessage("Upload succeeded but no image path was returned");
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      const newImages = [...destinationImages];
      newImages[index] = path;
      setDestinationImages(newImages);
      
      setMessageType("success");
      setMessage("Destination image uploaded successfully!");
      setTimeout(() => setMessage(""), 2000);
    } catch (err) { 
      console.error("Error uploading destination image:", err);
      setMessageType("error");
      setMessage("Failed to upload image");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploadingImage(null);
    }
  };

  const removeDestinationImage = (index: number) => {
    const newImages = [...destinationImages];
    newImages[index] = "";
    setDestinationImages(newImages);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        bio: formData.bio, 
        location: formData.location, 
        region: formData.region,
        languages: languagesTags,
        specialities: specialitiesTags,
        experience: parseInt(formData.experience) || 0,
        pricePerDay: parseFloat(formData.pricePerDay) || 0,
        coverImage: formData.coverImage,
        destinationImages: destinationImages.filter(img => img !== ""),
      };

      const response = await guidesApi.updateMyProfile(payload);
      const result = response.data;

      if (formData.avatar) {
        await usersApi.updateProfile({ avatar: formData.avatar });
      }

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
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to update profile");
    } finally { 
      setSaving(false); 
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <FaSpinner className="w-8 h-8 text-[#008A1E] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to load profile</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getRegionLabel = (r: string) => {
    if (!r) return "—";
    return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // If no profile exists (new guide)
  if (!profile) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FaUser className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Please complete your profile information so travelers can find you and book your services.
          </p>
          <button 
            onClick={() => setEditing(true)}
            className="px-6 py-3 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors"
          >
            Start Profile Setup →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your guide profile</p>
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
            onClick={() => setEditing(false)} 
            className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <FaTimes className="w-3 h-3" /> Cancel
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm mb-4 flex items-center gap-2 ${
          messageType === "success" ? "bg-green-100 text-green-700" : 
          messageType === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
        }`}>
          {messageType === "success" && <FaCheckCircle className="w-4 h-4" />}
          {messageType === "error" && <FaExclamationTriangle className="w-4 h-4" />}
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Cover Image Section */}
        <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 bg-gray-200">
          <img 
            src={formData.coverImage ? getImageUrl(formData.coverImage) : "/agency-placeholder.jpg"} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          {editing && (
            <label className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-black/60 hover:bg-black/70 text-white rounded-lg text-xs sm:text-sm cursor-pointer flex items-center gap-2 transition-colors">
              <FaCamera className="w-3 h-3" /> Change Cover
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "coverImage")} className="hidden" />
            </label>
          )}
        </div>

        {/* Avatar Section */}
        <div className="relative px-4 sm:px-6">
          <div className="relative -mt-12 sm:-mt-16 w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white bg-gray-200">
            <img 
              src={formData.avatar ? getImageUrl(formData.avatar) : "/guid-placeholder.jpg"} 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
            {editing && (
              <label className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-[#008A1E] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#006816] transition-colors">
                <FaCamera className="w-3 h-3 text-white" />
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "avatar")} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <p className="text-sm font-medium break-words">{profile?.users?.firstName} {profile?.users?.lastName}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <p className="text-sm font-medium break-words">{profile?.users?.email}</p>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Location</label>
              {editing ? (
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]" 
                />
              ) : (
                <p className="text-sm font-medium break-words">{profile?.location || "—"}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Region</label>
              {editing ? (
                <select 
                  value={formData.region} 
                  onChange={(e) => setFormData((p) => ({ ...p, region: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                >
                  <option value="">Select Region</option>
                  <option value="HUNZA">Hunza</option>
                  <option value="SKARDU">Skardu</option>
                  <option value="GILGIT">Gilgit</option>
                  <option value="SWAT">Swat</option>
                  <option value="CHITRAL">Chitral</option>
                  <option value="NARAN">Naran</option>
                </select>
              ) : (
                <p className="text-sm font-medium break-words">{getRegionLabel(profile?.region)}</p>
              )}
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Bio</label>
              {editing ? (
                <textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData((p) => ({ ...p, bio: e.target.value }))} 
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] resize-y" 
                />
              ) : (
                <p className="text-sm font-medium break-words">{profile?.bio || "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Languages</label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {languagesTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-[#008A1E]/10 text-[#008A1E] rounded-md text-sm">
                        {tag}
                        <button type="button" onClick={() => removeLanguageTag(tag)} className="hover:text-red-600">
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "language")}
                      placeholder="Type language and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                    />
                    <button type="button" onClick={addLanguageTag} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <FaPlus />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium">{languagesTags.length > 0 ? languagesTags.join(", ") : "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Specialities</label>
              {editing ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {specialitiesTags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm">
                        {tag}
                        <button type="button" onClick={() => removeSpecialityTag(tag)} className="hover:text-red-600">
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={specialityInput}
                      onChange={(e) => setSpecialityInput(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, "speciality")}
                      placeholder="Type speciality and press Enter"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                    />
                    <button type="button" onClick={addSpecialityTag} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                      <FaPlus />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-medium">{specialitiesTags.length > 0 ? specialitiesTags.join(", ") : "—"}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Experience (years)</label>
              {editing ? (
                <input 
                  type="number" 
                  value={formData.experience} 
                  onChange={(e) => setFormData((p) => ({ ...p, experience: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]" 
                />
              ) : (
                <p className="text-sm font-medium">{profile?.experience || 0} years</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price Per Day (PKR)</label>
              {editing ? (
                <input 
                  type="number" 
                  value={formData.pricePerDay} 
                  onChange={(e) => setFormData((p) => ({ ...p, pricePerDay: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]" 
                />
              ) : (
                <p className="text-sm font-medium">Rs {(profile?.pricePerDay || 0).toLocaleString()} / day</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Rating</label>
              <p className="text-sm font-medium flex items-center gap-1">
                <FaStar className="text-yellow-500 w-3 h-3" /> 
                {profile?.rating || 0} ({profile?.totalReviews || 0} reviews)
              </p>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 mb-1">Verified</label>
              <p className={`text-sm font-medium ${profile?.isVerified ? "text-green-600" : "text-yellow-600"}`}>
                {profile?.isVerified ? "Verified" : "Pending Verification"}
              </p>
            </div>
          </div>

          {/* Destination Images Section */}
          {editing && (
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Destination Images (Upload 3 photos)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative group">
                    {destinationImages[index] ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img src={getImageUrl(destinationImages[index])} alt={`Destination ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-3 py-2 bg-white text-gray-800 rounded-lg text-sm cursor-pointer hover:bg-gray-100 flex items-center gap-2">
                            <FaCamera className="w-4 h-4" /> Change
                            <input type="file" accept="image/*" onChange={(e) => handleDestinationImageUpload(e, index)} className="hidden" />
                          </label>
                          <button onClick={() => removeDestinationImage(index)} className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-2">
                            <FaTrash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#008A1E] transition-colors bg-gray-50">
                        {uploadingImage === index ? (
                          <FaSpinner className="w-8 h-8 text-[#008A1E] animate-spin mb-2" />
                        ) : (
                          <FaCamera className="w-8 h-8 text-gray-400 mb-2" />
                        )}
                        <span className="text-sm text-gray-500">
                          {uploadingImage === index ? "Uploading..." : `Upload Image ${index + 1}`}
                        </span>
                        <input type="file" accept="image/*" onChange={(e) => handleDestinationImageUpload(e, index)} className="hidden" />
                      </label>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Upload high-quality images (Max 5MB each)</p>
            </div>
          )}

          {/* Display destination images in view mode */}
          {!editing && destinationImages.filter(img => img).length > 0 && (
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-3">Destination Galleries</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {destinationImages.filter(img => img).map((img, idx) => (
                  <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img src={getImageUrl(img)} alt={`Destination ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          {editing && (
            <button onClick={handleSave} disabled={saving}
              className="w-full mt-8 py-3 bg-[#008A1E] text-white rounded-lg font-medium hover:bg-[#006816] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
              {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}