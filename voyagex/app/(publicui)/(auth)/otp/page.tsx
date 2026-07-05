"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api";

export default function OtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    const queryEmail =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("email")
        : null;
    const contact = queryEmail || sessionStorage.getItem("resetContact");
    if (contact) setContactInfo(contact);
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) setCanResend(true);
    return () => clearInterval(interval);
  }, [timer, canResend]);

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError("");
    if (digit && index < 5) inputRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
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
    if (e.key === "ArrowLeft" && index > 0) inputRefs[index - 1].current?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs[index + 1].current?.focus();
    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").split("");
        const newOtp = [...otp];
        digits.forEach((digit, i) => { if (i < 6) newOtp[i] = digit; });
        setOtp(newOtp);
        if (digits.length >= 6) inputRefs[5].current?.focus();
        else if (digits.length > 0) inputRefs[digits.length].current?.focus();
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) { setError("Please enter complete 6-digit OTP"); return; }
    setIsLoading(true);
    setError("");
    try {
      const response = await authApi.verifyOtp({ email: contactInfo, otp: otpCode });
      const result = response.data;
      if (result.success) {
        const isPasswordReset = sessionStorage.getItem("resetFlow") === "password";
        if (isPasswordReset) {
          sessionStorage.setItem("resetOtp", otpCode);
          router.push("/create-password");
        } else {
          sessionStorage.removeItem("resetContact");
          sessionStorage.removeItem("resetMethod");
          sessionStorage.removeItem("resetFlow");
          router.push("/login");
        }
      } else setError(result.message || "Invalid OTP. Please try again.");
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Invalid OTP. Please try again.";
      setError(message);
    } finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    if (!canResend || !contactInfo) return;
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: contactInfo });
      setTimer(60); setCanResend(false); setError("");
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0].current?.focus();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Failed to resend OTP";
      setError(msg);
    } finally { setIsLoading(false); }
  };

  const handleNotYou = () => {
    sessionStorage.removeItem("resetContact");
    sessionStorage.removeItem("resetMethod");
    sessionStorage.removeItem("resetToken");
    sessionStorage.removeItem("resetFlow");
    router.push("/reset-password");
  };

  return (
    <div className="relative w-full min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/Home.png')" }} />
      <div className="relative w-full lg:w-[741px] min-h-screen flex flex-col" style={{ backgroundImage: "url('/green.png')" }}>
        <button onClick={() => router.back()} className="ml-4 lg:ml-[84px] mt-8 lg:mt-12 w-7 h-6 flex-shrink-0">
          <svg className="w-7 h-6 transform rotate-180" viewBox="0 0 28 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M27.0607 13.0607C27.6464 12.4749 27.6464 11.5251 27.0607 10.9393L17.5147 1.3934C16.9289 0.807611 15.9792 0.807611 15.3934 1.3934C14.8076 1.97919 14.8076 2.92893 15.3934 3.51472L23.8787 12L15.3934 20.4853C14.8076 21.0711 14.8076 22.0208 15.3934 22.6066C15.9792 23.1924 16.9289 23.1924 17.5147 22.6066L27.0607 13.0607ZM0 13.5H26V10.5H0V13.5Z" fill="white"/>
          </svg>
        </button>
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 lg:py-0">
          <div className="w-full max-w-[400px]">
            <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-bold text-center mb-8">Confirm OTP</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex justify-end">
                <button type="button" onClick={handleNotYou} className="text-white text-sm sm:text-base hover:underline focus:outline-none">Not You?</button>
              </div>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input key={index} ref={inputRefs[index]} type="text" inputMode="numeric" value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-[45px] sm:w-[55px] h-[55px] sm:h-[65px] rounded-xl border-none outline-none bg-white text-gray-900 text-2xl sm:text-3xl font-semibold text-center focus:ring-2 focus:ring-[#008A1E]"
                    placeholder="0" maxLength={1} disabled={isLoading} />
                ))}
              </div>
              {contactInfo && <p className="text-center text-white/80 text-sm">OTP sent to {contactInfo}</p>}
              {error && <p className="text-red-300 text-sm text-center">{error}</p>}
              <div className="flex flex-col items-center gap-2">
                <p className="text-white text-sm sm:text-base">Didn't receive?{" "}
                  <button type="button" onClick={handleResend} disabled={!canResend || isLoading}
                    className={`font-semibold ${canResend && !isLoading ? "text-white hover:underline" : "text-white/50 cursor-not-allowed"}`}>Resend</button>
                </p>
                {!canResend && <p className="text-white/70 text-xs sm:text-sm">Resend available in {timer} seconds</p>}
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full h-14 bg-white text-gray-900 font-semibold text-lg lg:text-xl rounded-2xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4">
                {isLoading ? "Verifying..." : "Submit"}
              </button>
            </form>
            <p className="mt-6 text-center text-white text-sm sm:text-base">Back to{" "}
              <Link href="/login" className="font-semibold hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}