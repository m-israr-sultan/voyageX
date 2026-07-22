"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaBell, FaSearch, FaUserCircle, FaBars } from "react-icons/fa";
import { agenciesApi, notificationsApi, usersApi } from "@/lib/api";
import { clearAuth } from "@/lib/auth";
import { getImageUrl } from "@/lib/image-utils";

interface HeaderProps {
  role: "guide" | "traveler" | "agency" | "admin";
  onMenuClick?: () => void;
  userName?: string;
  userImage?: string;
}

export default function DashboardHeader({ role, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState("");
  const [loading, setLoading] = useState(true);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const roleBasePaths: Record<string, string> = {
    admin: "admin",
    guide: "guide-panel",
    traveler: "traveler-panel",
    agency: "agency-panel",
  };

  const basePath = roleBasePaths[role] || "traveler-panel";

  // Fetch display name + avatar for the header.
  // Agencies store their identity image on agencies.logo (not users.avatar) —
  // same source the working agency profile page uses via agenciesApi.getMyProfile().
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (role === "agency") {
          const response = await agenciesApi.getMyProfile();
          const result = response.data;
          const agency = result?.success !== undefined ? result.data : result;
          if (agency) {
            setUserName(agency.name || "Agency");
            setUserImage(agency.logo || "");
          }
        } else {
          const response = await usersApi.getProfile();
          const result = response.data;
          if (result.success && result.data) {
            const userData = result.data.user || result.data;
            const name = userData.firstName && userData.lastName
              ? `${userData.firstName} ${userData.lastName}`
              : userData.email?.split("@")[0] || "User";
            setUserName(name);
            setUserImage(userData.avatar || "");
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [role]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.getAll();
        const result = response.data;
        if (result.success && result.data) {
          const items = result.data.items || result.data || [];
          setNotifications(Array.isArray(items) ? items.slice(0, 5) : []);
        }
        const countResponse = await notificationsApi.getUnreadCount();
        const countResult = countResponse.data;
        if (countResult.success && countResult.data) {
          setUnreadCount(countResult.data.count || 0);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // Loading Skeleton
  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 h-14 fixed top-0 right-0 left-0 lg:left-64 z-20">
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          <div className="lg:hidden">
            <div className="w-8 h-8 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="flex-1 max-w-sm hidden sm:block">
            <div className="h-9 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 h-14 fixed top-0 right-0 left-0 lg:left-64 z-20">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <FaBars className="w-5 h-5" />
        </button>

        {/* Search Bar - Hidden on mobile, visible on tablet+ */}
        <div className="hidden sm:block flex-1 max-w-sm">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]/20 focus:border-[#008A1E] transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[min(100vw-1.5rem,24rem)] sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-xs text-[#008A1E] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <FaBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors ${
                          !notif.read ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <p className="text-sm text-gray-800 font-medium">
                          {notif.title || notif.message || notif.text}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notif.createdAt 
                            ? new Date(notif.createdAt).toLocaleString() 
                            : notif.time || ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-gray-100 text-center bg-gray-50/30">
                  <Link
                    href={`/${basePath}/dashboard/notifications`}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                    onClick={() => setShowNotifications(false)}
                  >
                    View all notifications →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1.5 transition-colors"
              aria-label="Profile menu"
            >
              {userImage ? (
                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                  <img
                    src={getImageUrl(userImage)}
                    alt={userName}
                    className="w-full h-full object-cover"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).style.display = "none";
                      (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }}
                  />
                  <FaUserCircle className="w-full h-full text-gray-400 hidden fallback-icon" />
                </div>
              ) : (
                <FaUserCircle className="w-7 h-7 text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:inline-block max-w-[100px] truncate">
                {userName.split(" ")[0]}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                  <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>
                <Link
                  href={`/${basePath}/dashboard/profile`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  My Profile
                </Link>
                <Link
                  href={`/${basePath}/dashboard/settings`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Settings
                </Link>
                <Link
                  href={`/${basePath}/dashboard/notifications`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors sm:hidden"
                  onClick={() => setShowProfileMenu(false)}
                >
                  Notifications
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}