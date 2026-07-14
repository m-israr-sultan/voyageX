"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaTimes, 
  FaCheck, 
  FaUpload, 
  FaExclamationTriangle,
  FaEye,
  FaImage,
  FaSort,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { packagesApi, destinationsApi, uploadApi } from "@/lib/api";
import { extractUploadPath, getImageUrl } from "@/lib/image-utils";

export default function GuidePackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("1");
  const [maxGroupSize, setMaxGroupSize] = useState("10");
  const [destinationId, setDestinationId] = useState("");

  // Tag inputs
  const [includeInput, setIncludeInput] = useState("");
  const [includes, setIncludes] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [excludes, setExcludes] = useState<string[]>([]);
  const [highlightInput, setHighlightInput] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [requirementInput, setRequirementInput] = useState("");
  const [requirements, setRequirements] = useState<string[]>([]);

  // Itinerary
  const [itinerary, setItinerary] = useState<any[]>([]);
  const [itinDay, setItinDay] = useState("");
  const [itinTitle, setItinTitle] = useState("");
  const [itinDesc, setItinDesc] = useState("");

  // Images
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [pkgRes, destRes] = await Promise.all([packagesApi.getMyPackages(), destinationsApi.getAll()]);
      if (pkgRes.data.success) { 
        const items = pkgRes.data.data?.items || pkgRes.data.data || []; 
        setPackages(Array.isArray(items) ? items : []); 
      }
      if (destRes.data.success) { 
        const items = destRes.data.data?.items || destRes.data.data || []; 
        setDestinations(Array.isArray(items) ? items : []); 
      }
    } catch (err: any) { 
      setError(err.response?.data?.message || "Failed to load data"); 
    } finally { 
      setLoading(false); 
    }
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setPrice(""); setDuration("1"); setMaxGroupSize("10"); setDestinationId("");
    setIncludes([]); setExcludes([]); setHighlights([]); setRequirements([]);
    setIncludeInput(""); setExcludeInput(""); setHighlightInput(""); setRequirementInput("");
    setItinerary([]); setItinDay(""); setItinTitle(""); setItinDesc("");
    setImages([]);
  };

  const handleAddTag = (input: string, setInput: (v: string) => void, arr: string[], setArr: (v: string[]) => void) => {
    const trimmed = input.trim();
    if (trimmed && !arr.includes(trimmed)) { setArr([...arr, trimmed]); setInput(""); }
  };

  const handleRemoveTag = (index: number, arr: string[], setArr: (v: string[]) => void) => {
    setArr(arr.filter((_, i) => i !== index));
  };

  const handleAddItineraryDay = () => {
    if (!itinDay || !itinTitle) return;
    setItinerary([...itinerary, { day: parseInt(itinDay), title: itinTitle, description: itinDesc }]);
    setItinDay(""); setItinTitle(""); setItinDesc("");
  };

  const handleRemoveItineraryDay = (index: number) => {
    setItinerary(itinerary.filter((_, i) => i !== index));
  };

  const moveItineraryDay = (index: number, direction: 'up' | 'down') => {
    const newItinerary = [...itinerary];
    if (direction === 'up' && index > 0) {
      [newItinerary[index], newItinerary[index - 1]] = [newItinerary[index - 1], newItinerary[index]];
    } else if (direction === 'down' && index < itinerary.length - 1) {
      [newItinerary[index], newItinerary[index + 1]] = [newItinerary[index + 1], newItinerary[index]];
    }
    setItinerary(newItinerary);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await uploadApi.uploadImage(formData);
      const path = extractUploadPath(response.data);
      if (path) setImages([...images, path]);
      else {
        setError("Upload succeeded but no image path was returned");
        setTimeout(() => setError(""), 3000);
      }
    } catch (err) { 
      console.error("Error uploading image:", err);
      setError("Failed to upload image");
      setTimeout(() => setError(""), 3000);
    } finally { 
      setUploadingImage(false); 
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Price must be greater than 0");
      return false;
    }
    if (!destinationId) {
      setError("Please select a destination");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setTimeout(() => setError(""), 3000);
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      const payload = {
        title, description,
        price: parseFloat(price),
        durationDays: parseInt(duration),
        maxGroupSize: parseInt(maxGroupSize),
        destinationId,
        includes, excludes,
        images,
        itinerary: itinerary.length > 0 ? itinerary : undefined,
      };
      if (editing) { 
        await packagesApi.update(editing.id, payload);
        setSuccessMessage("Package updated successfully!");
      } else { 
        await packagesApi.create(payload);
        setSuccessMessage("Package created successfully!");
      }
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowForm(false); 
      setEditing(null); 
      resetForm(); 
      fetchData();
    } catch (err: any) { 
      setError(err.response?.data?.message || "Failed to save package"); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleEdit = (pkg: any) => {
    setEditing(pkg);
    setTitle(pkg.title || ""); 
    setDescription(pkg.description || "");
    setPrice(pkg.price?.toString() || ""); 
    setDuration(pkg.duration?.toString() || "1");
    setMaxGroupSize(pkg.maxGroupSize?.toString() || "10"); 
    setDestinationId(pkg.destinationId || "");
    setIncludes(pkg.includes || []); 
    setExcludes(pkg.excludes || []);
    setHighlights(pkg.highlights || []); 
    setRequirements(pkg.requirements || []);
    setItinerary(pkg.itinerary || []); 
    setImages(pkg.images || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package? This action cannot be undone.")) return;
    setDeleteLoading(id);
    try { 
      await packagesApi.delete(id, true); 
      setSuccessMessage("Package deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchData(); 
    } catch (err: any) { 
      setError(err.response?.data?.message || "Failed to delete package");
      setTimeout(() => setError(""), 3000);
    } finally { 
      setDeleteLoading(null); 
    }
  };

  const getRegionLabel = (dest: any) => dest?.region?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) || "";

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
            <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
          </div>
          <div className="h-9 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center py-3 border-b last:border-0">
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-48 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Packages</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {packages.length} package{packages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} 
          className="w-full sm:w-auto px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] transition-colors flex items-center justify-center gap-2"
        >
          <FaPlus className="w-3 h-3" /> Create Package
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          <FaCheck className="inline w-4 h-4 mr-1" /> {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <FaExclamationTriangle className="inline w-4 h-4 mr-1" /> {error}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-900 text-base">
                {editing ? "Edit Package" : "Create New Package"}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="e.g., Hunza Valley Explorer"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    placeholder="Describe the tour experience..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR) *</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="5000"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days)</label>
                    <input 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(e.target.value)} 
                      min="1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
                    <input 
                      type="number" 
                      value={maxGroupSize} 
                      onChange={(e) => setMaxGroupSize(e.target.value)} 
                      min="1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                  <select 
                    value={destinationId} 
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  >
                    <option value="">Select Destination</option>
                    {destinations.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name} ({getRegionLabel(d)})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border group">
                      <img 
                        src={getImageUrl(img)} 
                        alt="" 
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setPreviewImage(img)}
                      />
                      <button 
                        type="button" 
                        onClick={() => setImages(images.filter((_, j) => j !== i))}
                        className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#008A1E] transition-colors bg-gray-50">
                    {uploadingImage ? (
                      <FaSpinner className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <FaUpload className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-400 mt-1">Upload</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400">Upload up to 10 images (JPG, PNG, max 5MB each)</p>
              </div>

              {/* Tag Inputs */}
              {[
                { label: "Includes", arr: includes, setArr: setIncludes, input: includeInput, setInput: setIncludeInput, placeholder: "Transport, Hotel, Meals..." },
                { label: "Excludes", arr: excludes, setArr: setExcludes, input: excludeInput, setInput: setExcludeInput, placeholder: "Flights, Tips, Insurance..." },
                { label: "Highlights", arr: highlights, setArr: setHighlights, input: highlightInput, setInput: setHighlightInput, placeholder: "Scenic views, Cultural sites..." },
                { label: "Requirements", arr: requirements, setArr: setRequirements, input: requirementInput, setInput: setRequirementInput, placeholder: "Warm clothes, Hiking boots..." },
              ].map((tagGroup) => (
                <div key={tagGroup.label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tagGroup.label}</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {tagGroup.arr.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {item}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(i, tagGroup.arr, tagGroup.setArr)} 
                          className="text-blue-400 hover:text-red-500 transition-colors"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={tagGroup.input} 
                      onChange={(e) => tagGroup.setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(tagGroup.input, tagGroup.setInput, tagGroup.arr, tagGroup.setArr); } }}
                      placeholder={tagGroup.placeholder}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleAddTag(tagGroup.input, tagGroup.setInput, tagGroup.arr, tagGroup.setArr)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}

              {/* Itinerary Builder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Daily Itinerary</label>
                <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                  {itinerary.map((day, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg group">
                      <div className="flex flex-col gap-0.5">
                        <button 
                          type="button" 
                          onClick={() => moveItineraryDay(i, 'up')} 
                          disabled={i === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <FaArrowUp className="w-3 h-3" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveItineraryDay(i, 'down')} 
                          disabled={i === itinerary.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <FaArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="w-8 h-8 bg-[#008A1E] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{day.title}</p>
                        {day.description && <p className="text-xs text-gray-500 truncate">{day.description}</p>}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItineraryDay(i)} 
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <input 
                    type="number" 
                    placeholder="Day" 
                    value={itinDay} 
                    onChange={(e) => setItinDay(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  />
                  <input 
                    type="text" 
                    placeholder="Title" 
                    value={itinTitle} 
                    onChange={(e) => setItinTitle(e.target.value)}
                    className="col-span-2 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Description (optional)" 
                    value={itinDesc} 
                    onChange={(e) => setItinDesc(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddItineraryDay} 
                    disabled={!itinDay || !itinTitle}
                    className="px-3 py-2 bg-[#008A1E] text-white rounded-lg text-sm hover:bg-[#006816] disabled:opacity-50 transition-colors"
                  >
                    Add Day
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={saving}
                className="w-full py-2.5 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheck className="w-4 h-4" />}
                {editing ? "Update Package" : "Create Package"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="max-w-2xl max-h-[80vh] rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={getImageUrl(previewImage)} alt="Preview" className="w-full h-full object-contain" />
            <button 
              onClick={() => setPreviewImage(null)} 
              className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Package List Table - Responsive */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {packages.length === 0 ? (
          <div className="text-center py-12">
            <FaExclamationTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No packages created yet</p>
            <button 
              onClick={() => { resetForm(); setEditing(null); setShowForm(true); }} 
              className="mt-3 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm"
            >
              Create Your First Package
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{pkg.title}</p>
                      <p className="text-xs text-gray-400">{pkg.destinations?.name}</p>
                     </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-gray-900">Rs {(pkg.price || 0).toLocaleString()}</span>
                     </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{pkg.duration} Days</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${pkg.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </span>
                     </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => handleEdit(pkg)} 
                          className="p-1.5 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                          title="Edit Package"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(pkg.id)} 
                          disabled={deleteLoading === pkg.id}
                          className="p-1.5 text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
                          title="Delete Package"
                        >
                          {deleteLoading === pkg.id ? <FaSpinner className="w-3.5 h-3.5 animate-spin" /> : <FaTrash className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                     </td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}