"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaHome,
  FaUser,
  FaBriefcase,
  FaCalendarAlt,
  FaStar,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
  FaChartBar,
  FaUsers,
  FaRoute,
  FaDollarSign,
  FaBell,
  FaShieldAlt,
  FaHeart,
  FaMapMarkerAlt,
  FaCreditCard,
  FaClipboardList,
  FaCheckSquare,
  FaGavel,
  FaWallet,
  FaHeartbeat,
  FaSync,
  FaCogs,
  FaTimes,
  FaChartLine,
  FaServer,
} from "react-icons/fa";
import { clearAuth } from "@/lib/auth";

interface SidebarProps {
  role: "guide" | "traveler" | "agency" | "admin";
  basePath: string;
  /** Mobile/tablet drawer open state. Ignored at lg+ where the sidebar is always visible. */
  isOpen?: boolean;
  /** Called on backdrop click, ESC, close button, or after navigating to a new route. */
  onClose?: () => void;
}

export default function DashboardSideBar({ role, basePath, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getNavItems = () => {
    const baseItems = [
      { href: `/${basePath}/dashboard`, label: "Dashboard", icon: FaHome },
      { href: `/${basePath}/dashboard/profile`, label: "Profile", icon: FaUser },
      { href: `/${basePath}/dashboard/notifications`, label: "Notifications", icon: FaBell },
      { href: `/message`, label: "Messages", icon: FaEnvelope },
      { href: `/${basePath}/dashboard/settings`, label: "Settings", icon: FaCog },
    ];
    const roleSpecificItems = {
      guide: [
        { href: `/guide-panel/dashboard/verification`, label: "Verification", icon: FaShieldAlt },
        { href: `/guide-panel/dashboard/tours`, label: "My Tours", icon: FaRoute },
        { href: `/guide-panel/dashboard/earnings`, label: "Earnings", icon: FaDollarSign },
        { href: `/guide-panel/dashboard/payout-accounts`, label: "Payout Accounts", icon: FaCreditCard },
        { href: `/guide-panel/dashboard/reviews`, label: "Reviews", icon: FaStar },
        { href: `/guide-panel/dashboard/availability`, label: "Availability", icon: FaCalendarAlt },
        { href: `/guide-panel/dashboard/packages`, label: "Packages", icon: FaBriefcase },
      ],
      traveler: [
        { href: `/traveler-panel/dashboard/bookings`, label: "My Bookings", icon: FaCalendarAlt },
        { href: `/traveler-panel/dashboard/wishlist`, label: "Wishlist", icon: FaHeart },
        { href: `/traveler-panel/dashboard/reviews`, label: "My Reviews", icon: FaStar },
        { href: `/traveler-panel/dashboard/payments`, label: "Payments", icon: FaDollarSign },
      ],
      agency: [
        { href: `/agency-panel/dashboard/verification`, label: "Verification", icon: FaShieldAlt },
        { href: `/agency-panel/dashboard/guides`, label: "My Guides", icon: FaUsers },
        { href: `/agency-panel/dashboard/packages`, label: "Packages", icon: FaBriefcase },
        { href: `/agency-panel/dashboard/bookings`, label: "Bookings", icon: FaCalendarAlt },
        { href: `/agency-panel/dashboard/earnings`, label: "Earnings", icon: FaDollarSign },
        { href: `/agency-panel/dashboard/reviews`, label: "Reviews", icon: FaStar },
        { href: `/agency-panel/dashboard/subscription`, label: "Subscription", icon: FaCreditCard },
        { href: `/agency-panel/dashboard/commissions`, label: "Commissions", icon: FaClipboardList },
      ],
      admin: [
        { href: `/admin/dashboard`, label: "Dashboard", icon: FaHome },
        { href: `/admin/dashboard/users`, label: "Users", icon: FaUsers },
        { href: `/admin/dashboard/guides`, label: "Guides", icon: FaUser },
        { href: `/admin/dashboard/guides/approval`, label: "Guide Approvals", icon: FaCheckSquare },
        { href: `/admin/dashboard/agencies`, label: "Agencies", icon: FaBriefcase },
        { href: `/admin/dashboard/agencies/approval`, label: "Agency Approvals", icon: FaCheckSquare },
        { href: `/admin/dashboard/travelers`, label: "Travelers", icon: FaUser },
        { href: `/admin/dashboard/destinations`, label: "Destinations", icon: FaMapMarkerAlt },
        { href: `/admin/dashboard/international-bookings`, label: "International Bookings", icon: FaClipboardList },
        { href: `/admin/dashboard/subscriptions`, label: "Subscriptions", icon: FaCreditCard },
        { href: `/admin/dashboard/commissions`, label: "Commissions", icon: FaDollarSign },
        { href: `/admin/dashboard/payouts`, label: "Guide Payouts", icon: FaWallet },
        { href: `/admin/dashboard/financial-records`, label: "Financial Records", icon: FaClipboardList },
        { href: `/admin/dashboard/financial-health`, label: "Financial Health", icon: FaHeartbeat },
        { href: `/admin/dashboard/reconciliation`, label: "Reconciliation", icon: FaSync },
        { href: `/admin/dashboard/webhooks`, label: "Webhook Ops", icon: FaEnvelope },
        { href: `/admin/dashboard/financial-settings`, label: "Financial Settings", icon: FaCogs },
        { href: `/admin/dashboard/reports`, label: "Reports", icon: FaChartBar },
        { href: `/admin/dashboard/verifications`, label: "Verifications", icon: FaShieldAlt },
        { href: `/admin/dashboard/disputes`, label: "Disputes", icon: FaGavel },
        { href: `/admin/dashboard/conversationMonitoring`, label: "Monitor", icon: FaEnvelope },
        { href: `/admin/dashboard/analytics`, label: "Analytics", icon: FaChartLine },
        { href: `/admin/dashboard/monitoring`, label: "System Health", icon: FaServer },
        { href: `/admin/dashboard/profile`, label: "Profile", icon: FaUser },
        { href: `/admin/dashboard/notifications`, label: "Notifications", icon: FaBell },
      ],
    };

    if (role === "admin") {
      return roleSpecificItems.admin;
    }
    return [...roleSpecificItems[role], ...baseItems];
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const getPanelTitle = () => {
    switch (role) {
      case "guide": return "Guide Panel";
      case "traveler": return "Traveler";
      case "agency": return "Agency Panel";
      case "admin": return "VoyageX";
      default: return "Panel";
    }
  };

  return (
    <>
      {/* Mobile/tablet backdrop — click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`w-[min(16rem,85vw)] sm:w-64 bg-white border-r border-gray-200 h-[100dvh] h-screen fixed left-0 top-0 overflow-y-auto overscroll-contain z-50 flex flex-col transition-transform duration-300 ease-in-out will-change-transform lg:translate-x-0 lg:z-30 ${
          isOpen ? "translate-x-0 shadow-xl lg:shadow-none" : "-translate-x-full"
        }`}
        aria-label={`${getPanelTitle()} navigation`}
      >
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              {getPanelTitle()}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{role}</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-md transition-colors"
            aria-label="Close menu"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-gray-900" : "text-gray-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}