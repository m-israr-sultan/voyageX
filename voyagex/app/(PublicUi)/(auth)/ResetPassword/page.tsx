"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Country data for phone
const countries = [
  { code: "+1", name: "United States", flag: "/US flag.png" },
  { code: "+44", name: "United Kingdom", flag: "/UK flag.png" },
  { code: "+92", name: "Pakistan", flag: "/PK flag.png" },
  { code: "+91", name: "India", flag: "/IN flag.png" },
  { code: "+86", name: "China", flag: "/CN flag.png" },
  { code: "+81", name: "Japan", flag: "/JP flag.png" },
  { code: "+49", name: "Germany", flag: "/DE flag.png" },
  { code: "+33", name: "France", flag: "/FR flag.png" },
  { code: "+39", name: "Italy", flag: "/IT flag.png" },
  { code: "+34", name: "Spain", flag: "/ES flag.png" },
  { code: "+61", name: "Australia", flag: "/AU flag.png" },
  { code: "+55", name: "Brazil", flag: "/BR flag.png" },
  { code: "+7", name: "Russia", flag: "/RU flag.png" },
  { code: "+82", name: "South Korea", flag: "/KR flag.png" },
  { code: "+20", name: "Egypt", flag: "/EG flag.png" },
  { code: "+27", name: "South Africa", flag: "/ZA flag.png" },
  { code: "+52", name: "Mexico", flag: "/MX flag.png" },
  { code: "+54", name: "Argentina", flag: "/AR flag.png" },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const [method, setMethod] = useState<"phone" | "email" | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    phone: "",
    email: "",
  });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone.replace(/\D/g, ''));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    setMethod("phone");
    if (errors.phone) {
      setErrors({ ...errors, phone: "" });
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setMethod("email");
    if (errors.email) {
      setErrors({ ...errors, email: "" });
    }
  };

  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowCountryDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {
      phone: "",
      email: "",
    };
    let hasError = false;

    if (!method) {
      alert("Please enter either phone number or email");
      return;
    }

    if (method === "phone") {
      if (!phone.trim()) {
        newErrors.phone = "Phone number is required";
        hasError = true;
      } else if (!validatePhone(phone)) {
        newErrors.phone = "Invalid phone number";
        hasError = true;
      }
    }

    if (method === "email") {
      if (!email.trim()) {
        newErrors.email = "Email is required";
        hasError = true;
      } else if (!validateEmail(email)) {
        newErrors.email = "Invalid email format";
        hasError = true;
      }
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // API call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const resetData = method === "phone" 
        ? { phone: `${selectedCountry.code}${phone}`, method: "phone" }
        : { email, method: "email" };
      
      console.log("Reset password request:", resetData);
      
      // Store contact info for OTP verification
      if (method === "phone") {
        sessionStorage.setItem("resetContact", `${selectedCountry.code}${phone}`);
        sessionStorage.setItem("resetMethod", "phone");
      } else {
        sessionStorage.setItem("resetContact", email);
        sessionStorage.setItem("resetMethod", "email");
      }
      
      // Navigate to OTP page
      router.push("/Otp");
    } catch (error) {
      console.error("Reset password failed:", error);
      alert("Failed to send OTP. Please try again.");
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
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-8 lg:mb-12">
              Reset Password
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Phone Number Field */}
              <div className="space-y-2">
                <label className="text-white text-sm sm:text-base font-medium block text-left">
                  Phone number
                </label>
                <div className="relative">
                  {/* Country Selector Button */}
                  <button
                    type="button"
                    onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-white/20 px-2 py-1.5 rounded-lg hover:bg-white/30 transition-colors z-10"
                  >
                    <Image 
                      src={selectedCountry.flag} 
                      alt={selectedCountry.name} 
                      width={24} 
                      height={16} 
                      className="object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm font-medium text-white">{selectedCountry.code}</span>
                    <svg className={`w-4 h-4 text-white transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Phone Input */}
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Phone number"
                    className={`w-full h-14 pl-[130px] pr-4 rounded-2xl border-none outline-none bg-white text-gray-900 placeholder-gray-400 ${
                      errors.phone && method === "phone" ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"
                    }`}
                    disabled={isLoading}
                  />

                  {/* Country Dropdown */}
                  {showCountryDropdown && (
                    <div className="absolute top-full left-3 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg z-50">
                      {countries.map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => handleCountrySelect(country)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <Image 
                            src={country.flag} 
                            alt={country.name} 
                            width={24} 
                            height={16} 
                            className="object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-sm font-medium text-gray-900">{country.code}</span>
                          <span className="text-sm text-gray-600">{country.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.phone && method === "phone" && (
                  <p className="text-red-300 text-xs sm:text-sm mt-1 text-left">{errors.phone}</p>
                )}
              </div>

              {/* OR Divider */}
              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-white text-lg sm:text-xl lg:text-2xl font-medium bg-transparent">
                    ------OR------
                  </span>
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-white text-sm sm:text-base font-medium block text-left">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Enter your email"
                  className={`w-full h-14 px-4 rounded-2xl border-none outline-none bg-white text-gray-900 placeholder-gray-400 ${
                    errors.email && method === "email" ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-[#008A1E]"
                  }`}
                  disabled={isLoading}
                />
                {errors.email && method === "email" && (
                  <p className="text-red-300 text-xs sm:text-sm mt-1 text-left">{errors.email}</p>
                )}
              </div>

              {/* Send OTP Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-white text-gray-900 font-semibold text-lg lg:text-xl rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>
            </form>

            {/* Back to Login Link */}
            <p className="mt-6 text-center text-white text-sm sm:text-base">
              Remember your password?{" "}
              <Link href="/Login" className="font-semibold hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}