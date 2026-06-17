"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function CreateNewPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    // Get reset contact info from sessionStorage
    const contact = sessionStorage.getItem("resetContact");
    const otp = sessionStorage.getItem("resetOtp");
    
    if (contact && otp) {
      setContactInfo(contact);
      setOtpCode(otp);
    } else {
      // If no contact info, redirect to reset password
      router.push("/reset-password");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!contactInfo) {
      setError("No contact info found. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.resetPassword({
        email: contactInfo,
        otp: otpCode,
        newPassword: password,
      });

      const result = response.data;

      if (result.success) {
        setSuccess("Password reset successfully! Redirecting to login...");
        
        // Clear session storage
        sessionStorage.removeItem("resetToken");
        sessionStorage.removeItem("resetContact");
        sessionStorage.removeItem("resetMethod");
        sessionStorage.removeItem("resetFlow");
        sessionStorage.removeItem("resetOtp");
        sessionStorage.removeItem("resetUserId");
        
        // Redirect to login page after 2 seconds
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(result.message || "Failed to reset password. Please try again.");
      }
    } catch (error: any) {
      console.error("Reset password failed:", error);
      const message = error.response?.data?.message || error.message || "Failed to reset password. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      {/* Main Background - Home.png */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Home.png')" }}
      />

      {/* Green Overlay Container */}
      <div 
        className="relative w-full lg:w-[741px] min-h-screen flex flex-col"
        style={{ backgroundImage: "url('/green.png')" }}
      >
        {/* Back Arrow */}
        <button 
          onClick={() => router.back()}
          className="ml-4 lg:ml-[84px] mt-8 lg:mt-12 w-7 h-6 flex-shrink-0"
        >
          <svg className="w-7 h-6 transform rotate-180" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27.0607 13.0607C27.6464 12.4749 27.6464 11.5251 27.0607 10.9393L17.5147 1.3934C16.9289 0.807611 15.9792 0.807611 15.3934 1.3934C14.8076 1.97919 14.8076 2.92893 15.3934 3.51472L23.8787 12L15.3934 20.4853C14.8076 21.0711 14.8076 22.0208 15.3934 22.6066C15.9792 23.1924 16.9289 23.1924 17.5147 22.6066L27.0607 13.0607ZM0 13.5H26V10.5H0V13.5Z" fill="white"/>
          </svg>
        </button>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 lg:py-0">
          <div className="w-full max-w-[400px]">
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-12">
              Create New Password
            </h1>

            {/* Contact Info Display */}
            {contactInfo && (
              <p className="text-center text-white/70 text-sm mb-6">
                Resetting password for: <span className="text-white font-medium">{contactInfo}</span>
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* New Password Field */}
              <div className="space-y-2">
                <label className="text-white text-sm sm:text-base font-medium block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full h-14 px-4 rounded-2xl border-none outline-none bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#008A1E]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-white text-sm sm:text-base font-medium block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full h-14 px-4 rounded-2xl border-none outline-none bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#008A1E]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <p className="text-xs text-white/60 mt-1">
                Use 8 or more characters with a mix of letters, numbers & symbols
              </p>

              {/* Success Message */}
              {success && (
                <p className="text-green-300 text-sm text-center">{success}</p>
              )}

              {/* Error Message */}
              {error && (
                <p className="text-red-300 text-sm text-center">{error}</p>
              )}

              {/* Reset Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-white text-gray-900 font-semibold text-lg lg:text-xl rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            {/* Back to Login Link */}
            <p className="mt-6 text-center text-white text-sm sm:text-base">
              Back to{" "}
              <Link href="/login" className="font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}