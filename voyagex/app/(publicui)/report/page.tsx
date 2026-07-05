"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { reportsApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import {
  FaFlag,
  FaExclamationTriangle,
  FaUserShield,
  FaFileAlt,
  FaPaperPlane,
  FaCheckCircle,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";

export default function ReportPage() {
  const [formData, setFormData] = useState({
    reportType: "",
    name: "",
    email: "",
    bookingId: "",
    guideName: "",
    title: "",
    description: "",
    urgency: "normal",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    title: "",
    description: "",
  });
  const [apiError, setApiError] = useState("");

  const reportTypes = [
    "Issue with Guide",
    "Payment Problem",
    "Booking Issue",
    "Safety Concern",
    "Harassment",
    "Scam Report",
    "Technical Issue",
    "Other",
  ];

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = { name: "", email: "", title: "", description: "" };
    let hasError = false;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      hasError = true;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      hasError = true;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    if (!isLoggedIn()) {
      setApiError("Please login first to submit a report.");
      return;
    }

    setIsSubmitting(true);
    setApiError("");
    try {
      const typeMap: Record<string, "GUIDE" | "PAYMENT" | "SAFETY" | "SCAM"> = {
        "Issue with Guide": "GUIDE",
        "Payment Problem": "PAYMENT",
        "Booking Issue": "SAFETY",
        "Safety Concern": "SAFETY",
        Harassment: "SAFETY",
        "Scam Report": "SCAM",
        "Technical Issue": "SAFETY",
        Other: "SAFETY",
      };
      await reportsApi.create({
        type: typeMap[formData.reportType] || "SAFETY",
        targetId: formData.bookingId || formData.guideName || formData.title,
        reason: formData.title,
        details: formData.description,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      const message =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        "Failed to submit report";
      setApiError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="relative h-[250px] md:h-[300px] bg-gradient-to-r from-[#008A1E] to-green-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Report an Issue
          </h1>
          <p className="text-lg text-white/90">
            Help us maintain a safe and trusted community
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Warning Box */}
          <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Important</h3>
                <p className="text-sm text-yellow-800">
                  If this is an emergency or involves immediate danger, please contact local authorities immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Report Form */}
          {isSubmitted ? (
            <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Report Submitted</h2>
              <p className="text-lg text-gray-600 mb-6">
                Thank you for your report. Our team will review it within 24-48 hours.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    reportType: "",
                    name: "",
                    email: "",
                    bookingId: "",
                    guideName: "",
                    title: "",
                    description: "",
                    urgency: "normal",
                  });
                }}
                className="px-8 py-3 bg-[#008A1E] text-white rounded-xl hover:bg-[#006816]"
              >
                Submit Another Report
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              {apiError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {apiError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Type *</label>
                  <select
                    name="reportType"
                    value={formData.reportType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  >
                    <option value="">Select report type</option>
                    {reportTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Name and Email */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-[#008A1E]`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-[#008A1E]`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                </div>

                {/* Booking ID and Guide Name */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Booking ID (if applicable)</label>
                    <input
                      type="text"
                      name="bookingId"
                      value={formData.bookingId}
                      onChange={handleChange}
                      placeholder="e.g., BKG-2024-001"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guide/agency Name (if applicable)</label>
                    <input
                      type="text"
                      name="guideName"
                      value={formData.guideName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                    />
                  </div>
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                  <div className="flex gap-4">
                    {["low", "normal", "high", "urgent"].map((level) => (
                      <label key={level} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="urgency"
                          value={level}
                          checked={formData.urgency === level}
                          onChange={handleChange}
                          className="w-4 h-4 text-[#008A1E]"
                        />
                        <span className="text-sm text-gray-700 capitalize">{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Report Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Brief summary of the issue"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.title ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-[#008A1E]`}
                  />
                  {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Please provide as much detail as possible..."
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    } focus:outline-none focus:ring-2 focus:ring-[#008A1E]`}
                  ></textarea>
                  {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Trust Message */}
          <div className="mt-8 bg-blue-50 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <FaUserShield className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Your report is confidential</h3>
                <p className="text-sm text-blue-800">
                  We take all reports seriously and will protect your privacy. Our team will investigate 
                  and take appropriate action while keeping your information confidential.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#008a1e] text-white pt-12 pb-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">VoyageX</div>
              <p className="text-gray-200 mb-6 text-sm">Building a safe travel community.</p>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center hover:bg-[#005a14]">
                  <FaTwitter className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center hover:bg-[#005a14]">
                  <FaFacebookF className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center hover:bg-[#005a14]">
                  <FaInstagram className="w-6 h-6" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["About", "Contact", "Packages", "Guide"].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-gray-200 hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                {["TermsAndServices", "Privacy", "CancelationPolicy"].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-gray-200 hover:text-white">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Emergency</h3>
              <p className="text-gray-200 text-sm">For emergencies, call: 1122</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}