"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getUser, isLoggedIn } from "@/lib/auth";
import DashboardSideBar from "@/components/dashboardsideBar";
import DashboardHeader from "@/components/dashboardheader";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const user = getUser();
    setUserData(user);

    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    if (user?.role !== "ADMIN") {
      router.push("/");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Checking permissions...</p>
      </div>
    );
  }

  const user = {
    name: userData
      ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Admin User"
      : "Admin User",
    image: userData?.avatar || "/admin-avatar.jpg",
    role: "admin" as const,
    basePath: "Admin",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSideBar role={user.role} basePath={user.basePath} />
      <DashboardHeader role={user.role} userName={user.name} userImage={user.image} />
      <main className="ml-60 pt-14 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}