"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaClock,
  FaCalendarAlt,
  FaCreditCard,
  FaWallet,
  FaMobileAlt,
  FaBuilding,
  FaInfoCircle,
} from "react-icons/fa";
import { agenciesApi, uploadApi } from "@/lib/api";

interface SubscriptionInfo {
  subscriptionStatus: string;
  freePeriodEndsAt: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
}

export default function AgencySubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [mobileNumber, setMobileNumber] = useState("");
  const [cardToken, setCardToken] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofUploading, setProofUploading] = useState(false);

  // Subscription amount is always Rs 10,000 — from PLATFORM_CONFIG.agencySubscriptionAmount
  const SUBSCRIPTION_AMOUNT = 10_000;

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agenciesApi.getMySubscription();
      const result = response.data;
      if (result.success && result.data) {
        setSubscription(result.data);
      } else {
        setError(result.message || "Failed to load subscription info");
      }
    } catch (err: any) {
      console.error("Error fetching subscription:", err);
      setError(err.response?.data?.message || "Failed to load subscription info");
    } finally {
      setLoading(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      setProofUrl(data.url ?? "");
    } catch {
      setError("Failed to upload proof. Please try again.");
    } finally {
      setProofUploading(false);
    }
  };

  const handlePaySubscription = async () => {
    if (paymentMethod === "BANK_TRANSFER" && !proofUrl) {
      setError("Please upload bank transfer proof before submitting");
      return;
    }
    if ((paymentMethod === "EASYPAISA" || paymentMethod === "JAZZCASH") && !mobileNumber.trim()) {
      setError("Mobile number is required");
      return;
    }
    if (paymentMethod === "CARD" && !cardToken.trim()) {
      setError("Card token is required (sandbox: any value)");
      return;
    }

    setPaymentLoading(true);
    setError(null);
    try {
      const response = await agenciesApi.paySubscription({
        paymentMethod,
        ...(mobileNumber && { mobileNumber }),
        ...(cardToken && { cardToken }),
        ...(bankReference && { bankReference }),
        ...(proofUrl && { proofUrl }),
      });
      const result = response.data;
      if (result.success || result.message) {
        setSuccessMessage(
          paymentMethod === "BANK_TRANSFER"
            ? "Bank transfer proof submitted! Your subscription will be activated once admin verifies the proof (within 24 hours)."
            : "Payment submitted! Your subscription is being activated.",
        );
        setTimeout(() => setSuccessMessage(null), 5000);
        setShowPaymentModal(false);
        setPaymentMethod("BANK_TRANSFER");
        setMobileNumber("");
        setCardToken("");
        setBankReference("");
        setProofUrl("");
        fetchSubscription();
      } else {
        setError(result.message || "Failed to record payment");
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message ?? "Failed to record payment");
    } finally {
      setPaymentLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusDisplay = () => {
    if (!subscription) return null;
    
    switch (subscription.subscriptionStatus) {
      case "FREE_TRIAL":
        const daysLeft = getDaysRemaining(subscription.freePeriodEndsAt);
        if (daysLeft !== null && daysLeft <= 3) {
          return {
            title: "Free Trial - Expiring Soon",
            message: `Your free trial ends in ${daysLeft} days. Please subscribe to keep your agency visible.`,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            icon: FaExclamationTriangle,
          };
        }
        return {
          title: "Free Trial Active",
          message: daysLeft ? `Your free trial ends in ${daysLeft} days.` : "Your free trial is active.",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          icon: FaClock,
        };
      
      case "PENDING_REVIEW":
        return {
          title: "Payment Under Review",
          message: "Your subscription payment proof has been submitted and is awaiting admin approval. Your subscription will be activated once approved.",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          icon: FaClock,
        };

      case "ACTIVE":
        const daysActive = getDaysRemaining(subscription.subscriptionEndDate);
        return {
          title: "Subscription Active",
          message: daysActive ? `Your subscription is active until ${new Date(subscription.subscriptionEndDate!).toLocaleDateString()} (${daysActive} days remaining).` : "Your subscription is active.",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          icon: FaCheckCircle,
        };
      
      case "EXPIRED":
        return {
          title: "Subscription Expired",
          message: "Your free trial has ended. Please subscribe to restore your agency visibility.",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          icon: FaTimesCircle,
        };
      
      default:
        return {
          title: "Unknown Status",
          message: "Please contact support.",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          icon: FaInfoCircle,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const needsPayment =
    subscription?.subscriptionStatus !== "PENDING_REVIEW" &&
    subscription?.subscriptionStatus !== "ACTIVE" &&
    (subscription?.subscriptionStatus === "EXPIRED" ||
      (subscription?.subscriptionStatus === "FREE_TRIAL" &&
        getDaysRemaining(subscription.freePeriodEndsAt) !== null &&
        getDaysRemaining(subscription.freePeriodEndsAt)! <= 3));

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-40 sm:w-48 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-56 sm:w-64 mt-2 animate-pulse"></div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-100 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Subscription</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage your agency subscription and billing
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          <FaCheckCircle className="inline w-4 h-4 mr-1" /> {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <FaExclamationTriangle className="inline w-4 h-4 mr-1" /> {error}
        </div>
      )}

      {/* Subscription Status Card */}
      {statusDisplay && (
        <div className={`rounded-xl border ${statusDisplay.borderColor} ${statusDisplay.bgColor} p-6`}>
          <div className="flex items-start gap-3">
            <statusDisplay.icon className={`w-6 h-6 ${statusDisplay.color} mt-0.5`} />
            <div className="flex-1">
              <h2 className={`text-lg font-semibold ${statusDisplay.color}`}>{statusDisplay.title}</h2>
              <p className={`text-sm mt-1 ${statusDisplay.color === "text-red-600" ? "text-red-700" : "text-gray-600"}`}>
                {statusDisplay.message}
              </p>
              {subscription?.subscriptionEndDate && subscription.subscriptionStatus === "ACTIVE" && (
                <p className="text-xs text-gray-500 mt-2">
                  Next billing: {new Date(subscription.subscriptionEndDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subscription Details */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-900">Subscription Details</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Current Status</span>
            <span className={`text-sm font-medium ${
              subscription?.subscriptionStatus === "ACTIVE" ? "text-green-600" :
              subscription?.subscriptionStatus === "FREE_TRIAL" ? "text-blue-600" : "text-red-600"
            }`}>
              {subscription?.subscriptionStatus === "FREE_TRIAL" ? "Free Trial" :
               subscription?.subscriptionStatus === "ACTIVE" ? "Active" : "Expired"}
            </span>
          </div>
          
          {subscription?.freePeriodEndsAt && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Free Trial Ends</span>
              <span className="text-sm text-gray-900">{new Date(subscription.freePeriodEndsAt).toLocaleDateString()}</span>
            </div>
          )}
          
          {subscription?.subscriptionStartDate && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Subscription Start</span>
              <span className="text-sm text-gray-900">{new Date(subscription.subscriptionStartDate).toLocaleDateString()}</span>
            </div>
          )}
          
          {subscription?.subscriptionEndDate && (
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Subscription End</span>
              <span className="text-sm text-gray-900">{new Date(subscription.subscriptionEndDate).toLocaleDateString()}</span>
            </div>
          )}
          
          <div className="flex justify-between py-2">
            <span className="text-sm text-gray-500">Monthly Fee</span>
            <span className="text-sm font-semibold text-gray-900">Rs {SUBSCRIPTION_AMOUNT.toLocaleString()} / month</span>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      {needsPayment && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-900">Subscribe Now</h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Subscribe to keep your agency visible to travelers. Monthly fee: <strong>Rs {SUBSCRIPTION_AMOUNT.toLocaleString()}</strong>
            </p>
            
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-3 bg-[#008A1E] text-white rounded-lg font-medium hover:bg-[#006816] transition-colors flex items-center justify-center gap-2"
            >
              <FaCreditCard className="w-4 h-4" /> Pay Rs {SUBSCRIPTION_AMOUNT.toLocaleString()}
            </button>
            
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FaInfoCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <p className="text-xs text-blue-700">
                  After payment, your agency will be visible in search results and listings for 30 days.
                  You will receive a reminder 3 days before expiration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box for Active Subscription */}
      {subscription?.subscriptionStatus === "ACTIVE" && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-800">Your Agency is Active</h4>
              <p className="text-xs text-green-700 mt-1">
                Your agency is visible to travelers. Make sure to keep your subscription active to maintain visibility.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Pay Subscription</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* SANDBOX BANNER */}
              <div className="bg-amber-50 border border-amber-300 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
                SANDBOX MODE — No real money is processed. Gateway integration pending.
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">Amount to Pay</p>
                <p className="text-2xl font-bold text-[#008A1E]">Rs {SUBSCRIPTION_AMOUNT.toLocaleString()} PKR</p>
                <p className="text-xs text-gray-500 mt-1">Valid for 30 days</p>
              </div>

              {error && (
                <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => { setPaymentMethod(e.target.value); setError(null); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                >
                  <option value="EASYPAISA">EasyPaisa</option>
                  <option value="JAZZCASH">JazzCash</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              {/* EasyPaisa / JazzCash */}
              {(paymentMethod === "EASYPAISA" || paymentMethod === "JAZZCASH") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number *
                  </label>
                  <input type="tel" placeholder="03XX-XXXXXXX" value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  />
                </div>
              )}

              {/* CARD — sandbox token */}
              {paymentMethod === "CARD" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Token <span className="text-gray-400 font-normal">(sandbox: any value)</span>
                  </label>
                  <input type="text" placeholder="sandbox_token_visa_4242" value={cardToken}
                    onChange={(e) => setCardToken(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  />
                </div>
              )}

              {/* BANK TRANSFER */}
              {paymentMethod === "BANK_TRANSFER" && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 rounded-lg p-3 text-xs text-yellow-800">
                    <p className="font-semibold">Transfer Rs {SUBSCRIPTION_AMOUNT.toLocaleString()} to:</p>
                    <p className="mt-1">Bank: Meezan Bank</p>
                    <p>Account: VoyageX Pvt Ltd</p>
                    <p>Account#: [Contact support]</p>
                    <p>IBAN: [Contact support]</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Reference #</label>
                    <input type="text" placeholder="e.g. TXN-123456789" value={bankReference}
                      onChange={(e) => setBankReference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Proof <span className="text-red-500">*</span>
                    </label>
                    {proofUrl ? (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        <FaCheckCircle /> Proof uploaded
                      </div>
                    ) : (
                      <label className="flex flex-col items-center gap-1 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#008A1E]">
                        {proofUploading ? (
                          <FaSpinner className="animate-spin text-[#008A1E]" />
                        ) : (
                          <>
                            <FaBuilding className="text-gray-400" />
                            <span className="text-xs text-gray-500">Click to upload receipt</span>
                          </>
                        )}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaySubscription}
                  disabled={paymentLoading || proofUploading}
                  className="flex-1 px-4 py-2 bg-[#008A1E] text-white rounded-lg text-sm font-medium hover:bg-[#006816] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {paymentLoading ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaCheckCircle className="w-4 h-4" />}
                  {paymentMethod === "BANK_TRANSFER" ? "Submit for Review" : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}