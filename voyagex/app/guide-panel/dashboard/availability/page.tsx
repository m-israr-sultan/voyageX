"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaCheck, 
  FaTimes, 
  FaSave, 
  FaCalendarAlt, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaClock,
  FaCalendarWeek,
} from "react-icons/fa";
import { guidesApi } from "@/lib/api";

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("success");
  const [error, setError] = useState<string | null>(null);

  const [isAvailable, setIsAvailable] = useState(true);
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await guidesApi.getMyProfile();
        const result = response.data;
        if (result.success && result.data) {
          const data = result.data;
          setIsAvailable(data.isAvailable !== false);
          setAvailableFrom(data.availableFrom ? new Date(data.availableFrom).toISOString().split("T")[0] : "");
          setAvailableUntil(data.availableUntil ? new Date(data.availableUntil).toISOString().split("T")[0] : "");
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.message || "Failed to load availability");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const validateDates = (): boolean => {
    if (availableFrom && availableUntil) {
      const fromDate = new Date(availableFrom);
      const untilDate = new Date(availableUntil);
      
      if (untilDate <= fromDate) {
        setMessageType("error");
        setMessage("End date must be after start date");
        return false;
      }
      
      if (fromDate < new Date()) {
        setMessageType("error");
        setMessage("Start date cannot be in the past");
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateDates()) {
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    
    setSaving(true);
    setMessage("");
    setMessageType("success");
    
    try {
      await guidesApi.updateMyProfile({
        isAvailable,
        availableFrom: availableFrom ? new Date(availableFrom).toISOString() : null,
        availableUntil: availableUntil ? new Date(availableUntil).toISOString() : null,
      });
      setMessageType("success");
      setMessage("Availability saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessageType("error");
      setMessage(err.response?.data?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const getAvailabilityStatus = () => {
    if (!isAvailable) {
      return { text: "Unavailable", color: "text-red-600", bg: "bg-red-50", icon: FaTimes };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (availableFrom && new Date(availableFrom) > today) {
      return { 
        text: `Available from ${new Date(availableFrom).toLocaleDateString()}`, 
        color: "text-yellow-600", 
        bg: "bg-yellow-50", 
        icon: FaClock 
      };
    }
    
    if (availableUntil && new Date(availableUntil) < today) {
      return { 
        text: "Availability period has expired", 
        color: "text-red-600", 
        bg: "bg-red-50", 
        icon: FaTimes 
      };
    }
    
    if (availableUntil) {
      return { 
        text: `Available until ${new Date(availableUntil).toLocaleDateString()}`, 
        color: "text-green-600", 
        bg: "bg-green-50", 
        icon: FaCalendarWeek 
      };
    }
    
    return { text: "Available now", color: "text-green-600", bg: "bg-green-50", icon: FaCheck };
  };

  const status = getAvailabilityStatus();

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-28 sm:w-32 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse"></div>
              <div className="h-3 w-48 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-14 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Availability</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage when travelers can book your services</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load availability</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = status.icon;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Availability</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage when travelers can book your services</p>
      </div>

      {/* Current Status Banner */}
      <div className={`${status.bg} rounded-xl border p-4 flex items-center gap-3`}>
        <StatusIcon className={`w-5 h-5 ${status.color}`} />
        <div>
          <p className={`text-sm font-medium ${status.color}`}>Current Status: {status.text}</p>
          {!isAvailable && (
            <p className="text-xs text-red-600 mt-1">
              Travelers cannot book you right now. Toggle the switch below to accept bookings.
            </p>
          )}
          {isAvailable && availableFrom && new Date(availableFrom) > new Date() && (
            <p className="text-xs text-yellow-600 mt-1">
              Bookings will start from {new Date(availableFrom).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
          messageType === "success" ? "bg-green-100 text-green-700" : 
          messageType === "error" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
        }`}>
          {messageType === "success" && <FaCheck className="w-4 h-4" />}
          {messageType === "error" && <FaExclamationTriangle className="w-4 h-4" />}
          {messageType === "info" && <FaInfoCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* Booking Status Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Booking Status</h2>
            <p className="text-xs text-gray-500 mt-1">
              {isAvailable 
                ? "You are currently accepting new booking requests" 
                : "You are not accepting new booking requests"}
            </p>
          </div>
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
              isAvailable ? "bg-[#008A1E]" : "bg-gray-300"
            }`}
          >
            <span 
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ${
                isAvailable ? "left-6" : "left-0.5"
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Available Date Range */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaCalendarAlt className="w-4 h-4 text-[#008A1E]" /> Available Date Range
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Set the date range when travelers can book you. Leave empty for no date restriction.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Available From
            </label>
            <input
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Available Until
            </label>
            <input
              type="date"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
              min={availableFrom || new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E] transition-all"
            />
          </div>
        </div>

        {/* Date Range Preview */}
        {availableFrom && availableUntil && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Active period:</strong> {new Date(availableFrom).toLocaleDateString()} - {new Date(availableUntil).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#008A1E] text-white rounded-lg font-medium hover:bg-[#006816] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
        {saving ? "Saving..." : "Save Availability"}
      </button>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">How it works</h4>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• When marked as unavailable, travelers won't see the "Book Now" button on your profile</li>
              <li>• Set date range to automatically become available/unavailable on specific dates</li>
              <li>• Existing bookings are not affected by availability changes</li>
              <li>• You can always override availability by manually toggling the switch</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}