"use client";

import { useState, useEffect } from "react";
import {
  FaSpinner,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { destinationsApi, uploadApi } from "@/lib/api";
import { extractUploadPath, getImageUrl } from "@/lib/image-utils";

export default function AdminDestinationsPage() {
  const [destinations, setDestinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    country: "Pakistan",
    region: "",
    description: "",
    image: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const northernRegions = [
    "HUNZA",
    "SKARDU",
    "GILGIT",
    "NAGAR",
    "GHIZER",
    "SWAT",
    "KALAM",
    "CHITRAL",
    "NARAN",
    "KAGHAN",
    "MURREE",
    "ABBOTTABAD",
    "NEELUM_VALLEY",
    "MUZAFFARABAD",
    "RAWALAKOT",
  ];

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const response = await destinationsApi.getAll();
      const result = response.data;
      if (result.success && result.data) {
        const items = result.data.items || result.data || [];
        setDestinations(Array.isArray(items) ? items : []);
      }
    } catch (err: any) {
      setError("Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  /**
   * FIXED:
   * - Uses backend `url` via extractUploadPath()
   * - Stores: /api/v1/images/images/filename.jpg
   * - Does NOT invent URL from bare filename
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setUploading(true);
    setError("");

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      const response = await uploadApi.uploadImage(uploadFormData);
      const imagePath = extractUploadPath(response.data);

      if (!imagePath) {
        setError("Upload succeeded but no image path was returned");
        return;
      }

      // Store relative proxy path in form/DB
      setForm((prev) => ({ ...prev, image: imagePath }));
    } catch (err: any) {
      console.error("Error uploading image:", err);
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.region) {
      setError("Name, city, and region are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        title: form.name, // keep both for backend compatibility
        city: form.city,
        country: form.country,
        region: form.region,
        description: form.description,
        image: form.image || undefined,
      };

      if (editing) {
        await destinationsApi.update(editing.id, payload);
      } else {
        await destinationsApi.create(payload);
      }

      setShowForm(false);
      setEditing(null);
      setForm({
        name: "",
        city: "",
        country: "Pakistan",
        region: "",
        description: "",
        image: "",
      });
      setImageFile(null);
      fetchDestinations();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save destination");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dest: any) => {
    setEditing(dest);
    setForm({
      name: dest.name || "",
      city: dest.city || "",
      country: dest.country || "Pakistan",
      region: dest.region || "",
      description: dest.description || "",
      image: dest.image || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this destination? This cannot be undone."))
      return;
    try {
      await destinationsApi.delete(id, true);
      fetchDestinations();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete destination");
    }
  };

  const openAddForm = () => {
    setEditing(null);
    setForm({
      name: "",
      city: "",
      country: "Pakistan",
      region: "",
      description: "",
      image: "",
    });
    setImageFile(null);
    setShowForm(true);
  };

  const getRegionLabel = (region: string) => {
    return region.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Destinations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {destinations.length} destinations
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] flex items-center gap-2"
        >
          <FaPlus className="w-3 h-3" /> Add Destination
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {editing ? "Edit Destination" : "Add Destination"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Hunza Valley"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g., Hunza"
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Region *
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) =>
                      setForm({ ...form, region: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  >
                    <option value="">Select Region</option>
                    {northernRegions.map((r) => (
                      <option key={r} value={r}>
                        {getRegionLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full text-sm"
                />
                {uploading && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <FaSpinner className="w-3 h-3 animate-spin" /> Uploading...
                  </p>
                )}
                {form.image && !uploading && (
                  <div className="relative rounded-md overflow-hidden mt-2 bg-gray-100">
                    <img
                      src={getImageUrl(form.image)}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/agency-placeholder.jpg";
                      }}
                    />
                    <p className="text-[10px] text-gray-400 mt-1 break-all px-1">
                      {form.image}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving || uploading}
                className="w-full py-2.5 bg-[#008A1E] text-white rounded-md text-sm font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaCheck className="w-3 h-3" />
                )}
                {editing ? "Update" : "Add"} Destination
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Destination
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Region
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {destinations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    No destinations yet
                  </td>
                </tr>
              ) : (
                destinations.map((dest) => (
                  <tr key={dest.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                          {dest.image ? (
                            <img
                              src={getImageUrl(dest.image)}
                              alt={dest.name}
                              className="w-10 h-10 object-cover rounded-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/agency-placeholder.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <FaMapMarkerAlt className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {dest.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {dest.city}, {dest.country}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {getRegionLabel(dest.region || "")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          dest.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {dest.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(dest)}
                          className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
                        >
                          <FaEdit className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dest.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 flex items-center gap-1"
                        >
                          <FaTrash className="w-3 h-3" /> Delete
                        </button>
                      </div>
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