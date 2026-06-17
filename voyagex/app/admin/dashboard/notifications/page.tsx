"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaBell, FaCheck, FaTrash } from "react-icons/fa";
import { notificationsApi } from "@/lib/api";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAll();
      const result = response.data;
      if (result.success && result.data) {
        const items = result.data.items || result.data || [];
        setNotifications(Array.isArray(items) ? items : []);
      }
    } catch (err: any) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (err) { console.error("Failed:", err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) { console.error("Failed:", err); }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete all notifications?")) return;
    try {
      await notificationsApi.deleteAll();
      setNotifications([]);
    } catch (err) { console.error("Failed:", err); }
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
          <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">{notifications.filter((n) => !n.isRead).length} unread</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1">
            <FaCheck className="w-3 h-3" /> Mark All Read
          </button>
          <button onClick={handleDeleteAll} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 flex items-center gap-1">
            <FaTrash className="w-3 h-3" /> Clear All
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>}

      {notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FaBell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white rounded-lg border p-4 flex items-start justify-between ${
                !notif.isRead ? "border-blue-200 bg-blue-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  !notif.isRead ? "bg-blue-100" : "bg-gray-100"
                }`}>
                  <FaBell className={`w-3.5 h-3.5 ${!notif.isRead ? "text-blue-600" : "text-gray-400"}`} />
                </div>
                <div>
                  <p className={`text-sm ${!notif.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {notif.title || notif.message || "Notification"}
                  </p>
                  {notif.body && <p className="text-xs text-gray-500 mt-0.5">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                  </p>
                </div>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0 ml-3"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}