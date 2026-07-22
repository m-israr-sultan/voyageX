"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DashboardSideBar from "@/components/dashboardsideBar";
import DashboardHeader from "@/components/dashboardheader";

interface DashboardShellProps {
  role: "guide" | "traveler" | "agency" | "admin";
  basePath: string;
  userName: string;
  userImage: string;
  children: React.ReactNode;
}

/**
 * Shared responsive dashboard shell used by all four dashboards
 * (admin, guide, agency, traveler).
 *
 * Desktop (lg+): sidebar is always visible, static in layout flow via margin offset.
 * Tablet/mobile (<lg): sidebar is an off-canvas drawer, hidden by default, toggled via
 * the header hamburger button, closable via backdrop click, ESC key, or navigation.
 */
export default function DashboardShell({
  role,
  basePath,
  userName,
  userImage,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close the drawer whenever the route changes (e.g. after clicking a nav link).
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // ESC key closes the drawer.
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  // Prevent body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-gray-50 overflow-x-hidden">
      <DashboardSideBar
        role={role}
        basePath={basePath}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <DashboardHeader
        role={role}
        userName={userName}
        userImage={userImage}
        onMenuClick={() => setSidebarOpen((open) => !open)}
      />
      {/*
        Sidebar is fixed/off-canvas below lg, so main stays full-width (no layout shift).
        From lg+, offset by sidebar width (w-64).
      */}
      <main className="w-full lg:ml-64 lg:w-[calc(100%-16rem)] pt-14 p-3 min-[375px]:p-4 sm:p-6 min-w-0 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full min-w-0">{children}</div>
      </main>
    </div>
  );
}
