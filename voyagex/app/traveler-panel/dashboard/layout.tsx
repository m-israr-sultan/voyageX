"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { getToken, clearAuth } from "@/lib/auth";
import { usersApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import { FaSpinner } from "react-icons/fa";

export default function TravelerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndFetchUser = async () => {
      const token = getToken();
      
      // Check if token exists
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Fetch user profile from backend to verify token is valid
        const response = await usersApi.getProfile();
        const result = response.data;
        
        if (result.success && result.data) {
          const data = result.data.user || result.data;
          
          // Verify role is TRAVELER
          if (data.role !== "TRAVELER") {
            router.push("/");
            return;
          }
          
          setUserData(data);
        } else {
          // Invalid response
          clearAuth();
          router.push("/login");
        }
      } catch (err: any) {
        console.error("Error verifying user:", err);
        // Token might be expired or invalid
        if (err.response?.status === 401) {
          clearAuth();
          router.push("/login");
        } else {
          setError("Failed to load user data");
        }
      } finally {
        setChecking(false);
      }
    };

    verifyAndFetchUser();
  }, [router]);

  // Loading State with Skeleton
  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 text-[#008A1E] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm hover:bg-[#006816]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const userName = userData 
    ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Traveler"
    : "Traveler";

  const userImage = userData?.avatar ? getImageUrl(userData.avatar) : "/guid-placeholder.jpg";

  return (
    <DashboardShell role="traveler" basePath="traveler-panel" userName={userName} userImage={userImage}>
      {children}
    </DashboardShell>
  );
}