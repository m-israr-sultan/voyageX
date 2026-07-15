"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getUser, isLoggedIn } from "@/lib/auth";
import { getImageUrl } from "@/lib/image-utils";

export default function GuideDashboardLayout({
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
    if (user?.role !== "GUIDE") {
      router.push("/");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const user = {
    name: userData
      ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Guide"
      : "Guide",
    image: userData?.avatar ? getImageUrl(userData.avatar) : "/guid-placeholder.jpg",
    role: "guide" as const,
    basePath: "guide-panel",
  };

  return (
    <DashboardShell role={user.role} basePath={user.basePath} userName={user.name} userImage={user.image}>
      {children}
    </DashboardShell>
  );
}