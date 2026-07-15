"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getUser, isLoggedIn } from "@/lib/auth";
import DashboardShell from "@/components/DashboardShell";
import { getImageUrl } from "@/lib/image-utils";

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
    image: userData?.avatar ? getImageUrl(userData.avatar) : "/admin-avatar.jpg",
    role: "admin" as const,
    basePath: "Admin",
  };

  return (
    <DashboardShell role={user.role} basePath={user.basePath} userName={user.name} userImage={user.image}>
      {children}
    </DashboardShell>
  );
}