"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Get contact info from sessionStorage
  useEffect(() => {
    const contact = sessionStorage.getItem("resetContact");
    const method = sessionStorage.getItem("resetMethod");
    
    if (contact) {
      setContactInfo(contact);
    } else {
      // If no contact info, redirect to reset password
      router.push("/ResetPassword");
    }
  }, [router]);

  // Timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;
    
    // Take only last character if multiple are pasted
    const digit = value.slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs[index - 1].current?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
    
    // Handle left arrow
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    // Handle right arrow
    if (e.key === "ArrowRight" && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
    
    // Handle paste
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => {
          if (i < 4) newOtp[i] = digit;
        });
        setOtp(newOtp);
        if (digits.length >= 4) {
          inputRefs[3].current?.focus();
        } else if (digits.length > 0) {
          inputRefs[digits.length].current?.focus();
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join("");
    
    if (otpCode.length < 4) {
      setError("Please enter complete OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // API call here
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("OTP verified:", otpCode);
      
      // Clear session storage
      sessionStorage.removeItem("resetContact");
      sessionStorage.removeItem("resetMethod");
      
      // Navigate to create new password page
      router.push("/CreateNewPassword");
    } catch (error) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    
    try {
      // API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("OTP resent to:", contactInfo);
      
      // Reset timer
      setTimer(60);
      setCanResend(false);
      setError("");
      
      // Clear OTP fields
      setOtp(["", "", "", ""]);
      inputRefs[0].current?.focus();
      
    } catch (error) {
      setError("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotYou = () => {
    sessionStorage.removeItem("resetContact");
    sessionStorage.removeItem("resetMethod");
    router.push("/ResetPassword");
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
              Confirm OTP
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Not You Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNotYou}
                  className="text-white text-sm sm:text-base hover:underline focus:outline-none"
                >
                  Not You?
                </button>
              </div>

              {/* OTP Input Fields */}
              <div className="flex justify-center gap-3 sm:gap-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-[70px] sm:w-[87px] h-[60px] sm:h-[72px] rounded-2xl border-none outline-none bg-white text-gray-900 text-3xl sm:text-4xl font-semibold text-center focus:ring-2 focus:ring-[#008A1E]"
                    placeholder="0"
                    maxLength={1}
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* Contact Info */}
              {contactInfo && (
                <p className="text-center text-white/80 text-sm">
                  OTP sent to {contactInfo}
                </p>
              )}

              {/* Error Message */}
              {error && (
                <p className="text-red-300 text-sm text-center">{error}</p>
              )}

              {/* Resend Section */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-white text-sm sm:text-base">
                  Didn't receive?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || isLoading}
                    className={`font-semibold ${
                      canResend && !isLoading
                        ? "text-white hover:underline"
                        : "text-white/50 cursor-not-allowed"
                    }`}
                  >
                    Resend
                  </button>
                </p>
                {!canResend && (
                  <p className="text-white/70 text-xs sm:text-sm">
                    Resend available in {timer} seconds
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-white text-gray-900 font-semibold text-lg lg:text-xl rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {isLoading ? "Verifying..." : "Submit"}
              </button>
            </form>

            {/* Back to Login Link */}
            <p className="mt-6 text-center text-white text-sm sm:text-base">
              Back to{" "}
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