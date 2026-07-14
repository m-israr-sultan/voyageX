"use client";
import { useState } from "react";
import { FaCreditCard, FaMobileAlt, FaWallet, FaCheckCircle, FaLock, FaBuilding, FaInfoCircle, FaCloudUploadAlt } from "react-icons/fa";
import { paymentsApi, uploadApi } from "@/lib/api";
import { extractUploadPath } from "@/lib/image-utils";
import type { PaymentMethodType } from "@/lib/types/payment.types";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: {
    bookingId?: string;
    totalAmount?: number;
    packageId?: string;
    packageName?: string;
    pricePerPerson?: number;
    travelers?: number;
    startDate?: string;
    endDate?: string;
    duration?: number;
    bookingType?: string;
  };
  onSuccess: (...args: unknown[]) => void;
}

/**
 * Maps UI method key to the canonical PaymentMethodType expected by the backend.
 * CARD replaces the old "VOYAGEX" string (which was never a valid backend value).
 * CASH, MANUAL, VOYAGEX must never appear here — they are permanently banned.
 */
const METHOD_MAP: Record<string, PaymentMethodType> = {
  easypaisa: "EASYPAISA",
  jazzcash: "JAZZCASH",
  card: "CARD",      // Fixed: was incorrectly "VOYAGEX" — C-2
  bank: "BANK_TRANSFER",
};

// VoyageX bank details — update before go-live
const VOYAGEX_BANK = {
  bankName: "Meezan Bank",
  accountName: "VoyageX Pvt Ltd",
  accountNumber: "[Contact support for account details]",
  iban: "[Contact support for IBAN]",
};

export default function PaymentModal({ isOpen, onClose, bookingData, onSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [step, setStep] = useState<"method" | "details" | "processing" | "success" | "pending_review">("method");

  const [mobileNumber, setMobileNumber] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofUploading, setProofUploading] = useState(false);

  /*
   * CARD TOKENISATION — PRODUCTION REQUIREMENT
   *
   * Raw card data (PAN, CVV, expiry) must NEVER reach VoyageX servers.
   * This violates PCI DSS. Before go-live, replace this field with the
   * payment gateway's hosted SDK:
   *
   *   Option 1 — Stripe:
   *     Use Stripe.js + <CardElement> component.
   *     Stripe tokenises the card client-side; send token to backend.
   *     Install: npm install @stripe/stripe-js @stripe/react-stripe-js
   *
   *   Option 2 — HBL PayConnect:
   *     Redirect traveler to HBL hosted page. Card data never touches VoyageX.
   *
   *   Option 3 — 1Link:
   *     Use 1Link hosted fields SDK.
   *
   * In sandbox mode: accept any non-empty string as cardToken.
   */
  const [cardToken, setCardToken] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const paymentMethods = [
    { id: "easypaisa", name: "EasyPaisa", icon: FaMobileAlt, color: "#00B050", description: "Pay via EasyPaisa mobile wallet" },
    { id: "jazzcash", name: "JazzCash", icon: FaMobileAlt, color: "#E30613", description: "Pay via JazzCash mobile wallet" },
    { id: "card", name: "Credit / Debit Card", icon: FaCreditCard, color: "#1E40AF", description: "Visa, Mastercard, or other cards" },
    { id: "bank", name: "Bank Transfer", icon: FaWallet, color: "#059669", description: "Direct bank account transfer" },
  ];

  if (!isOpen) return null;

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setStep("details");
    setError("");
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadApi.uploadImage(formData);
      const path = extractUploadPath(res.data);
      if (!path) {
        setError("Upload succeeded but no proof path was returned");
        return;
      }
      setProofUrl(path);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message ?? "Failed to upload proof. Please try again.");
    } finally {
      setProofUploading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!selectedMethod) {
      setError("Please select a payment method");
      return;
    }

    // Validation per method
    if (selectedMethod === "card" && !cardToken.trim()) {
      setError("Please enter the card token (sandbox: any value)");
      return;
    }
    if (selectedMethod === "easypaisa" && !mobileNumber.trim()) {
      setError("Please enter your EasyPaisa mobile number");
      return;
    }
    if (selectedMethod === "jazzcash" && !mobileNumber.trim()) {
      setError("Please enter your JazzCash mobile number");
      return;
    }
    if (selectedMethod === "bank" && !proofUrl) {
      setError("Please upload your bank transfer proof before submitting");
      return;
    }

    setIsLoading(true);
    setError("");
    setStep("processing");

    try {
      await paymentsApi.initiate({
        bookingId: bookingData.bookingId ?? "",
        paymentMethod: METHOD_MAP[selectedMethod],
        amount: bookingData.totalAmount ?? 0,
        ...(mobileNumber && { mobileNumber }),
        ...(cardToken && { cardToken }),
        ...(bankReference && { bankReference }),
        ...(proofUrl && { proofUrl }),
      });

      if (selectedMethod === "bank") {
        setStep("pending_review");
      } else {
        setStep("success");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setError(apiErr.response?.data?.message ?? "Payment processing failed. Please try again.");
      setStep("details");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      {/* SANDBOX MODE BANNER */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-2 flex items-start gap-2">
        <FaInfoCircle className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 font-medium">
          SANDBOX MODE — All payments are simulated. No real money is processed.
          Gateway integration pending.
        </p>
      </div>
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Select Payment Method</h3>
        <p className="text-gray-600 text-sm mt-1">All payments are held securely by VoyageX until trip completion</p>
        <p className="text-sm font-semibold text-gray-800 mt-2">
          Amount: Rs {(bookingData.totalAmount ?? 0).toLocaleString()}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          return (
            <button key={method.id} onClick={() => handleMethodSelect(method.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                selectedMethod === method.id ? "border-[#008A1E] bg-[#E6F4EA]" : "border-gray-200 hover:border-[#008A1E]/50"
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${method.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: method.color }} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="bg-blue-50 rounded-lg p-3 mt-4">
        <div className="flex items-start gap-2">
          <FaLock className="w-4 h-4 text-blue-600 mt-0.5" />
          <p className="text-xs text-blue-800">
            <strong>Secure Escrow:</strong> Your payment is held by VoyageX and released to the guide only after successful trip completion.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPaymentDetails = () => {
    const method = paymentMethods.find(m => m.id === selectedMethod);
    return (
      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <button type="button" onClick={() => setStep("method")} className="text-[#008A1E] text-sm hover:underline">← Back</button>
          <h3 className="text-lg font-bold text-gray-900">Pay with {method?.name}</h3>
        </div>
        {error && <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">{error}</div>}

        {/* CARD — Sandbox token input (PCI DSS: no raw card data) */}
        {selectedMethod === "card" && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800 font-semibold">SANDBOX MODE</p>
              <p className="text-xs text-amber-700 mt-1">
                Enter any value as a test token. In production, this will be replaced
                with a real card tokenisation SDK (Stripe, HBL, or 1Link).
                Raw card numbers (PAN/CVV) are never collected or stored.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Token <span className="text-gray-400 font-normal">(sandbox: any value)</span>
              </label>
              <input
                type="text"
                placeholder="sandbox_token_visa_4242"
                value={cardToken}
                onChange={(e) => setCardToken(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
              />
            </div>
          </div>
        )}

        {/* EASYPAISA */}
        {selectedMethod === "easypaisa" && (
          <div className="space-y-3">
            <div className="bg-[#00B050]/10 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-700">Enter your EasyPaisa registered mobile number</p>
              <p className="text-xs text-gray-500 mt-1">You will receive a confirmation SMS to approve payment</p>
            </div>
            <input
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
            />
          </div>
        )}

        {/* JAZZCASH */}
        {selectedMethod === "jazzcash" && (
          <div className="space-y-3">
            <div className="bg-[#E30613]/10 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-700">Enter your JazzCash registered mobile number</p>
              <p className="text-xs text-gray-500 mt-1">You will receive a confirmation SMS to approve payment</p>
            </div>
            <input
              type="tel"
              placeholder="03XX-XXXXXXX"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
            />
          </div>
        )}

        {/* BANK TRANSFER */}
        {selectedMethod === "bank" && (
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaBuilding className="text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">VoyageX Bank Account</p>
              </div>
              <div className="space-y-1 text-sm text-gray-700">
                <p><span className="font-medium">Bank:</span> {VOYAGEX_BANK.bankName}</p>
                <p><span className="font-medium">Account Name:</span> {VOYAGEX_BANK.accountName}</p>
                <p><span className="font-medium">Account:</span> {VOYAGEX_BANK.accountNumber}</p>
                <p><span className="font-medium">IBAN:</span> {VOYAGEX_BANK.iban}</p>
              </div>
              <p className="text-xs text-[#008A1E] mt-3 font-medium">
                After transferring, upload your bank receipt below. Admin will verify within 24 hours.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Reference Number <span className="text-gray-400">(from your receipt)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. TXN-123456789"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Proof <span className="text-red-500">*</span>
              </label>
              {proofUrl ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <FaCheckCircle className="text-green-600" />
                  <span className="text-sm text-green-700">Proof uploaded successfully</span>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#008A1E] transition-colors">
                  {proofUploading ? (
                    <div className="w-5 h-5 border-2 border-[#008A1E] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FaCloudUploadAlt className="text-gray-400 text-2xl" />
                      <span className="text-sm text-gray-600">Click to upload bank receipt screenshot</span>
                    </>
                  )}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofUpload} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Amount summary */}
        <div className="bg-[#E6F4EA] rounded-lg p-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-[#008A1E]">
              Rs {(bookingData.totalAmount ?? 0).toLocaleString()} PKR
            </span>
          </div>
          {selectedMethod === "bank" && (
            <p className="text-xs text-gray-500 mt-2">
              Booking activates once admin verifies your proof (within 24 hours).
            </p>
          )}
        </div>

        <button type="submit" disabled={isLoading || proofUploading}
          className="w-full h-14 bg-[#008A1E] text-white font-semibold rounded-xl hover:bg-[#006816] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {isLoading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
          ) : (
            <><FaLock className="w-4 h-4" />
              {selectedMethod === "bank" ? "Submit for Verification" : `Pay Rs ${(bookingData.totalAmount ?? 0).toLocaleString()} PKR`}
            </>
          )}
        </button>
      </form>
    );
  };

  const renderProcessing = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 border-4 border-[#008A1E] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">Processing Payment…</h3>
      <p className="text-gray-600 text-sm mt-2">Please do not close this window</p>
    </div>
  );

  const renderPendingReview = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaInfoCircle className="w-8 h-8 text-amber-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Payment Submitted</h3>
      <p className="text-gray-600 mt-2 text-sm">
        Your bank transfer proof has been submitted for verification.
        You will be notified within 24 hours.
      </p>
      <button
        onClick={() => { onSuccess(); onClose(); }}
        className="mt-6 px-6 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors"
      >
        OK
      </button>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FaCheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
      <p className="text-gray-600 mt-2">Booking confirmed.</p>
      <p className="text-xs text-[#008A1E] mt-3">Funds are held by VoyageX until trip completion.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {step === "method" && renderMethodSelection()}
          {step === "details" && renderPaymentDetails()}
          {step === "processing" && renderProcessing()}
          {step === "pending_review" && renderPendingReview()}
          {step === "success" && renderSuccess()}
        </div>
        {step !== "success" && step !== "pending_review" && (
          <div className="px-6 py-4 border-t border-gray-100">
            <button onClick={onClose} className="w-full py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
