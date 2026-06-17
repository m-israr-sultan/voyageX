"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaSpinner, 
  FaBell, 
  FaCheck, 
  FaTrash, 
  FaExclamationTriangle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaStar,
  FaComment,
  FaUserCheck,
  FaFlagCheckered,
  FaWallet,
  FaBuilding,
} from "react-icons/fa";
import { notificationsApi } from "@/lib/api";

export default function AgencyNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { 
    fetchNotifications(); 
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationsApi.getAll();
      const result = response.data;
      if (result.success && result.data) {
        const items = result.data.items || result.data || [];
        setNotifications(Array.isArray(items) ? items : []);
      } else {
        setNotifications([]);
      }
    } catch (err: any) { 
      console.error("Failed to load notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally { 
      setLoading(false); 
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) { 
      console.error("Failed to mark as read:", err);
      setError("Failed to mark notification as read");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try { 
      await notificationsApi.markAllAsRead(); 
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true }))); 
    } catch (err) { 
      console.error("Failed to mark all as read:", err);
      setError("Failed to mark all as read");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => { 
    if (!confirm("Are you sure you want to delete all notifications? This action cannot be undone.")) return; 
    setActionLoading(true);
    try { 
      await notificationsApi.deleteAll(); 
      setNotifications([]); 
    } catch (err) { 
      console.error("Failed to delete all:", err);
      setError("Failed to delete notifications");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, any> = {
      BOOKING_CONFIRMED: FaCheck,
      BOOKING_CANCELLED: FaTrash,
      BOOKING_COMPLETED: FaFlagCheckered,
      PAYMENT_RECEIVED: FaMoneyBillWave,
      PAYMENT_RELEASED: FaWallet,
      TOUR_STARTED: FaUserCheck,
      COMPLETION_REQUESTED: FaBell,
      COMPLETION_CONFIRMED: FaCheck,
      NEW_REVIEW: FaStar,
      NEW_MESSAGE: FaComment,
      ACCOUNT_VERIFIED: FaUserCheck,
      AGENCY_VERIFIED: FaBuilding,
      GENERAL: FaBell,
    };
    const Icon = iconMap[type] || FaBell;
    return Icon;
  };

  const getNotificationColor = (type: string, isRead: boolean) => {
    if (!isRead) return "bg-blue-100 text-blue-600";
    
    const colorMap: Record<string, string> = {
      BOOKING_CONFIRMED: "bg-green-100 text-green-600",
      BOOKING_CANCELLED: "bg-red-100 text-red-600",
      BOOKING_COMPLETED: "bg-green-100 text-green-600",
      PAYMENT_RECEIVED: "bg-emerald-100 text-emerald-600",
      PAYMENT_RELEASED: "bg-emerald-100 text-emerald-600",
      NEW_REVIEW: "bg-yellow-100 text-yellow-600",
      NEW_MESSAGE: "bg-purple-100 text-purple-600",
      TOUR_STARTED: "bg-blue-100 text-blue-600",
      COMPLETION_REQUESTED: "bg-orange-100 text-orange-600",
      COMPLETION_CONFIRMED: "bg-green-100 text-green-600",
      AGENCY_VERIFIED: "bg-green-100 text-green-600",
    };
    return colorMap[type] || "bg-gray-100 text-gray-500";
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
            <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
        
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error && notifications.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Stay updated with your agency activity</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load notifications</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchNotifications()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllRead} 
            disabled={unreadCount === 0 || actionLoading}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <FaCheck className="w-3 h-3" /> Mark All Read
          </button>
          <button 
            onClick={handleDeleteAll} 
            disabled={notifications.length === 0 || actionLoading}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <FaTrash className="w-3 h-3" /> Clear All
          </button>
        </div>
      </div>

      {/* Error Message (non-fatal) */}
      {error && notifications.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaBell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">No notifications</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            You're all caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = getNotificationIcon(notif.type);
            const iconColor = getNotificationColor(notif.type, notif.isRead);
            
            return (
              <div 
                key={notif.id} 
                className={`bg-white rounded-xl border p-4 flex items-start justify-between transition-all hover:shadow-md ${
                  !notif.isRead ? "border-l-4 border-l-[#008A1E] border-blue-200 bg-blue-50/20" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                      {notif.title || notif.message || "Notification"}
                    </p>
                    {notif.body && (
                      <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <FaCalendarAlt className="w-3 h-3" />
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                      </p>
                      {notif.type && (
                        <span className="text-xs text-gray-400 capitalize">
                          {notif.type.toLowerCase().replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {!notif.isRead && (
                  <button 
                    onClick={() => handleMarkAsRead(notif.id)} 
                    className="text-xs text-[#008A1E] hover:text-[#006816] flex-shrink-0 ml-3 transition-colors"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Notification Types Legend */}
      {notifications.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Notification Types</h4>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500">Booking</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-xs text-gray-500">Payment</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs text-gray-500">Tour Status</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-xs text-gray-500">Messages</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-xs text-gray-500">Reviews</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-gray-500">Verification</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}