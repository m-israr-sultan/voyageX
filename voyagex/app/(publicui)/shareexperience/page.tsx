"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  FaStar,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCamera,
  FaPaperPlane,
  FaCheckCircle,
} from "react-icons/fa";
import { uploadApi } from "@/lib/api";

export default function ShareExperiencePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    destination: "",
    date: "",
    title: "",
    experience: "",
    rating: 5,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [activeTab, setActiveTab] = useState("share");
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Upload photos first if any
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const formDataUpload = new FormData();
        selectedFiles.forEach((file) => {
          formDataUpload.append("files", file);
        });

        const uploadResponse = await uploadApi.uploadMultiple(formDataUpload);
        const uploadResult = uploadResponse.data;

        if (uploadResult.success && uploadResult.data) {
          uploadedUrls = uploadResult.data.urls || uploadResult.data;
        }
      }

      if (!uploadedUrls.length) {
        throw new Error("Please upload at least one image to share your experience.");
      }

      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: "",
          email: "",
          destination: "",
          date: "",
          title: "",
          experience: "",
          rating: 5,
        });
        setSelectedFiles([]);
        setSelectedRating(5);
      }, 3000);
    } catch (err: any) {
      console.error("Share experience failed:", err);
      const message = err.response?.data?.message || err.message || "Failed to share experience. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setSelectedRating(star)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <FaStar
              className={`w-5 h-5 ${
                star <= (interactive ? selectedRating : rating)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[350px] bg-gradient-to-r from-[#008A1E] to-green-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Share Your Experience
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            Tell us about your adventure and inspire others to explore
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full shadow-md p-1 inline-flex">
            <button
              onClick={() => setActiveTab("share")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "share"
                  ? "bg-[#008A1E] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Share Experience
            </button>
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === "recent"
                  ? "bg-[#008A1E] text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Recent Stories
            </button>
          </div>
        </div>

        {/* Share Experience Form */}
        {activeTab === "share" && (
          <div className="max-w-3xl mx-auto">
            {isSubmitted ? (
              <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FaCheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Your experience has been shared successfully. It will be reviewed and posted shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-8 py-3 bg-[#008A1E] text-white rounded-xl hover:bg-[#006816] transition-colors"
                >
                  Share Another
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell Us About Your Journey</h2>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                      <select
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                        disabled={isSubmitting}
                      >
                        <option value="">Select destination</option>
                        <option value="Hunza Valley">Hunza Valley</option>
                        <option value="Skardu">Skardu</option>
                        <option value="Swat Valley">Swat Valley</option>
                        <option value="Naran Kaghan">Naran Kaghan</option>
                        <option value="Fairy Meadows">Fairy Meadows</option>
                        <option value="Neelum Valley">Neelum Valley</option>
                        <option value="Murree">Murree</option>
                        <option value="Chitral">Chitral</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Travel Date *</label>
                      <input
                        type="month"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
                    {renderStars(selectedRating, true)}
                  </div>

                  {/* Experience Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Best Trek of My Life!"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Experience Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Experience *</label>
                    <textarea
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      placeholder="Tell us about your journey, the places you visited, the people you met, and what made it special..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                      disabled={isSubmitting}
                    ></textarea>
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photos</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#008A1E] transition-colors">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="photo-upload"
                        disabled={isSubmitting}
                      />
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <FaCamera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Click to upload photos</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                      </label>
                      {selectedFiles.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700">{selectedFiles.length} files selected</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[#008A1E] text-white font-semibold rounded-xl hover:bg-[#006816] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="w-4 h-4" />
                        Share Experience
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Recent Experiences */}
        {activeTab === "recent" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="p-6 text-center text-gray-600">
                No published stories yet.
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}