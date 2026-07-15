"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { FaBell, FaUserCircle } from "react-icons/fa";
import { notificationsApi, usersApi } from "../lib/api";
import { clearAuth, isLoggedIn as checkLoggedIn, getDashboardPath } from "../lib/auth";
import { getImageUrl } from "../lib/image-utils";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [userAvatar, setUserAvatar] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [avatarError, setAvatarError] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { name: "Destinations", path: "/destination" },
    { name: "Team", path: "/about" },
    { name: "Packages", path: "/packages" },
    // { name: "About", path: "/about" },
    // { name: "Contact", path: "/contact" },
  ];

  const authItems = [
    { name: "Login", path: "/login" },
    { name: "Sign Up", path: "/register", isButton: true },
  ];

  useEffect(() => {
    const loggedInStatus = checkLoggedIn();
    setLoggedIn(loggedInStatus);
    if (loggedInStatus) {
      fetchUserProfile();
      fetchNotifications();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await usersApi.getProfile();
      const result = response.data;
      if (result.success && result.data) {
        const userData = result.data;
        setUser(userData);
        const name =
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : userData.email?.split("@")[0] || "User";
        setUserName(name);
        setUserAvatar(userData.avatar || "");
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.response?.status === 401) {
        clearAuth();
        setLoggedIn(false);
      }
    }
  };

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationsApi.getAll(),
        notificationsApi.getUnreadCount(),
      ]);
      const notifResult = notifRes.data;
      const countResult = countRes.data;
      if (notifResult.success && notifResult.data) {
        const items = notifResult.data.items || notifResult.data || [];
        setNotifications(items.slice(0, 5));
      }
      if (countResult.success && countResult.data) {
        setNotificationCount(countResult.data.count || 0);
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotificationCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error: any) {
      console.error("Error marking all read:", error);
    }
  };

  const handleLogout = () => {
    clearAuth();
    setLoggedIn(false);
    setUser(null);
    setUserName("");
    setUserAvatar("");
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    return getDashboardPath(user.role);
  };

  const getUserDisplayName = () => {
    return userName || "Account";
  };

  return (
    <nav className="flex flex-row justify-between items-center bg-white w-full h-20 mx-auto z-50 relative shadow-sm">
      <div className="pl-4 sm:pl-6 lg:pl-8 xl:pl-10 2xl:pl-12">
        <Link href="/" className="flex items-center">
          <Image
            src="/voyageX-logo.png"
            alt="VoyageX Logo"
            width={217}
            height={50}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Desktop Nav Links */}
      <div className="hidden lg:flex flex-1 justify-center">
        <ul className="flex flex-row justify-center items-center gap-6 lg:gap-8 xl:gap-10 list-none">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={`${
                  pathname === item.path
                    ? "text-green-600 font-semibold"
                    : "text-gray-800 hover:text-green-600"
                } cursor-pointer transition-colors duration-200 font-medium text-sm lg:text-base xl:text-lg`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop Auth / User Menu */}
      <div className="hidden lg:flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8 xl:pr-10 2xl:pr-12">
        {loggedIn ? (
          <>
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-full"
              >
                <FaBell className="w-5 h-5 text-gray-600" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    {notificationCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#008A1E] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 text-center">
                        No notifications
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${
                            !notif.read ? "bg-blue-50" : ""
                          }`}
                        >
                          <p className="text-sm">
                            {notif.title || notif.message || notif.text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.createdAt
                              ? new Date(notif.createdAt).toLocaleString()
                              : notif.time || ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={getDashboardLink()}
                className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-2"
              >
                {userAvatar && !avatarError ? (
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={getImageUrl(userAvatar)}
                      alt={getUserDisplayName()}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                ) : (
                  <FaUserCircle className="w-8 h-8 text-gray-600" />
                )}
                <span className="text-sm font-medium">
                  {getUserDisplayName().split(" ")[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <ul className="flex flex-row justify-center items-center gap-4 lg:gap-6 xl:gap-8 list-none">
            {authItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className={`${
                    item.isButton
                      ? "bg-green-600 text-white px-4 lg:px-6 py-2 rounded-full hover:bg-green-700 text-sm lg:text-base"
                      : pathname === item.path
                      ? "text-green-600 font-semibold"
                      : "text-gray-800 hover:text-green-600"
                  } cursor-pointer transition-colors duration-200 font-medium text-sm lg:text-base`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden flex items-center pr-4 sm:pr-6">
        <button
          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-green-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <div className="space-y-1.5">
            <span
              className={`block w-6 h-0.5 bg-gray-700 transition-all ${
                isMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-gray-700 transition-all ${
                isMenuOpen ? "opacity-0" : "opacity-100"
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-gray-700 transition-all ${
                isMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed top-20 left-0 right-0 bottom-0 bg-white lg:hidden z-50 overflow-y-auto">
          <div className="flex flex-col h-full">
            <div className="p-6 border-b">
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`${
                      pathname === item.path
                        ? "text-green-600 font-semibold bg-green-50"
                        : "text-gray-800 hover:text-green-600 hover:bg-gray-50"
                    } py-3 px-4 rounded-lg text-base`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="p-6 mt-auto border-t">
              <div className="flex flex-col gap-3">
                {loggedIn ? (
                  <>
                    <Link
                      href={getDashboardLink()}
                      className="py-3 px-4 rounded-lg text-base text-gray-800 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="py-3 px-4 rounded-lg text-base text-red-600 hover:bg-gray-50 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  authItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`${
                        item.isButton
                          ? "bg-green-600 text-white text-center"
                          : pathname === item.path
                          ? "text-green-600 font-semibold bg-green-50"
                          : "text-gray-800 hover:text-green-600 hover:bg-gray-50"
                      } py-3 px-4 rounded-lg text-base`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))
                )}
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;