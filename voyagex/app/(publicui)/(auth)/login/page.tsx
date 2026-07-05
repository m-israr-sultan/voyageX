"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { saveAuth, getDashboardPath } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: "", password: "" });
    setApiError("");

    let hasError = false;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email is required";
      hasError = true;
    } else if (!validateEmail(email)) {
      newErrors.email = "Invalid email format";
      hasError = true;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      hasError = true;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      saveAuth(accessToken, refreshToken, user);

      const dashboardPath = getDashboardPath(user.role);
      router.push(dashboardPath);

    } catch (error: any) {
      const message =
        error.response?.data?.message || "Invalid email or password";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/Home.png')" }}
      />
      <div
        className="relative w-full lg:w-[741px] min-h-screen flex flex-col justify-center items-start px-4 sm:px-6 py-8"
        style={{ backgroundImage: "url('/green.png')" }}
      >
        <div className="w-full max-w-[400px] ml-0 lg:ml-8">
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold text-left mb-8 sm:mb-10 lg:mb-12">
            Login
          </h1>

          {apiError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-white text-sm sm:text-base font-medium block text-left">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`w-full h-12 sm:h-14 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${
                  errors.email
                    ? "ring-2 ring-red-500"
                    : "focus:ring-2 focus:ring-[#008A1E]"
                }`}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-300 text-xs sm:text-sm text-left">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-white text-sm sm:text-base font-medium">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/reset-password")}
                  className="text-white text-xs sm:text-sm hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full h-12 sm:h-14 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${
                    errors.password
                      ? "ring-2 ring-red-500"
                      : "focus:ring-2 focus:ring-[#008A1E]"
                  }`}
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
              {errors.password && (
                <p className="text-red-300 text-xs sm:text-sm text-left">
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 sm:mt-8 text-left text-white text-sm sm:text-base">
            Don't have an account?{" "}
            <Link href="/register" className="font-semibold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}