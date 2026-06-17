"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import Image from "next/image";

export default function TouristRegistration() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: ""
  });
  const [errors, setErrors] = useState<any>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8) newErrors.password = "Minimum 8 characters";
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setIsLoading(true);
    setApiError("");
    try {
      await authApi.registerTraveler({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
      sessionStorage.setItem("resetContact", formData.email);
      router.push(`/otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error: any) {
      setApiError(error.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/Home.png')" }} />
      <div className="relative w-full lg:w-[741px] min-h-screen flex flex-col justify-center items-start px-4 sm:px-6 py-8" style={{ backgroundImage: "url('/green.png')" }}>
        <div className="w-full max-w-[400px] ml-0 lg:ml-8">
          <h1 className="text-white text-4xl sm:text-5xl font-bold text-left mb-8">Create Account</h1>
          
          {apiError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded-lg text-sm">{apiError}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-white text-sm font-medium block">First Name</label>
              <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter your first name" disabled={isLoading}
                className={`w-full h-12 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${errors.firstName ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"}`} />
              {errors.firstName && <p className="text-red-300 text-xs">{errors.firstName}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-white text-sm font-medium block">Last Name</label>
              <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter your last name" disabled={isLoading}
                className={`w-full h-12 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${errors.lastName ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"}`} />
              {errors.lastName && <p className="text-red-300 text-xs">{errors.lastName}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-white text-sm font-medium block">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" disabled={isLoading}
                className={`w-full h-12 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${errors.email ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"}`} />
              {errors.email && <p className="text-red-300 text-xs">{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-white text-sm font-medium block">Password</label>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="flex items-center gap-2 text-sm text-white/80">
                  <Image src="/icon.png" alt="" width={18} height={16} />
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 characters" disabled={isLoading}
                className={`w-full h-12 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${errors.password ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"}`} />
              {errors.password && <p className="text-red-300 text-xs">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-white text-sm font-medium block">Confirm Password</label>
              <input type={showPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat your password" disabled={isLoading}
                className={`w-full h-12 px-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 outline-none ${errors.confirmPassword ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"}`} />
              {errors.confirmPassword && <p className="text-red-300 text-xs">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={isLoading} className="w-full h-12 bg-white text-gray-900 font-semibold rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50">
              {isLoading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
          
          <p className="mt-6 text-left text-white text-sm">Already have an account? <Link href="/login" className="font-semibold hover:underline">Login</Link></p>
        </div>
      </div>
    </div>
  );
}