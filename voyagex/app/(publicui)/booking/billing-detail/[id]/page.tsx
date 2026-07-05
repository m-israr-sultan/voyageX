"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  FaArrowLeft,
  FaCreditCard,
  FaMobileAlt,
  FaWallet,
  FaLock,
  FaSpinner,
  FaWhatsapp,
  FaGlobe,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import PaymentModal from "@/components/paymentmodal";
import { bookingsApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function BillingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [existingBookingId, setExistingBookingId] = useState<string | null>(null);
  const [showInternationalWarning, setShowInternationalWarning] = useState(false);

  const DRAFT_KEY = `booking_draft_${params.id}`;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    const type = searchParams.get("type") || "package";
    const itemId = searchParams.get("itemId") || params.id;
    const itemName = searchParams.get("itemName") || "";
    const duration = parseInt(searchParams.get("duration") || "1");
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const travelers = parseInt(searchParams.get("travelers") || "1");
    const notes = searchParams.get("notes") || "";
    const image = searchParams.get("image") || "/agency-placeholder.jpg";

    // Restore payment method selection from sessionStorage after reconnect
    const savedMethod = sessionStorage.getItem(`${DRAFT_KEY}_method`);
    if (savedMethod) setSelectedMethod(savedMethod);

    const fetchPrice = async () => {
      try {
        const priceRes = await bookingsApi.calculatePrice({
          packageId: type === "package" ? (itemId as string) : undefined,
          guideId: type === "guide" ? (itemId as string) : undefined,
          startDate,
          endDate,
          groupSize: travelers,
        });
        const priceData = priceRes.data?.data || priceRes.data;
        const backendTotal = priceData?.total ?? priceData?.basePrice ?? 0;
        const backendPrice = priceData?.pricePerPerson ?? priceData?.pricePerDay ?? 0;

        const info = {
          type,
          itemId,
          itemName,
          price: backendPrice,
          duration,
          startDate,
          endDate,
          travelers,
          notes,
          image,
          total: backendTotal,
          pricingModel: type === "guide" ? "PER_DAY" : "PER_PERSON",
        };
        setBookingInfo(info);
        // Persist booking context so reconnect can restore it
        try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(info)); } catch {}
      } catch {
        // Try to restore from sessionStorage if backend is unreachable
        try {
          const cached = sessionStorage.getItem(DRAFT_KEY);
          if (cached) setBookingInfo(JSON.parse(cached));
          else setBookingInfo(null);
        } catch { setBookingInfo(null); }
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
  }, [searchParams, params.id, router]);

  const createBooking = async () => {
    if (existingBookingId) return existingBookingId;
    
    setCreatingBooking(true);
    try {
      const response = await bookingsApi.create({
        packageId: bookingInfo.type === "package" ? bookingInfo.itemId : undefined,
        guideId: bookingInfo.type === "guide" ? bookingInfo.itemId : undefined,
        startDate: bookingInfo.startDate,
        endDate: bookingInfo.endDate,
        groupSize: bookingInfo.travelers,
        notes: bookingInfo.notes,
      });
      
      const result = response.data;
      if (result.success && result.data) {
        const bookingId = result.data.id;
        setExistingBookingId(bookingId);
        return bookingId;
      }
      throw new Error("Failed to create booking");
    } catch (err: any) {
      console.error("Error creating booking:", err);
      // If duplicate booking, try to extract existing booking ID from error
      if (err.response?.data?.data?.id) {
        setExistingBookingId(err.response.data.data.id);
        return err.response.data.data.id;
      }
      throw err;
    } finally {
      setCreatingBooking(false);
    }
  };

  const [bookingError, setBookingError] = useState<string | null>(null);

  const handleMethodSelect = async (methodId: string) => {
    setSelectedMethod(methodId);
    // Persist selection — survives page refresh if connection drops
    try { sessionStorage.setItem(`${DRAFT_KEY}_method`, methodId); } catch {}
    setBookingError(null);
    
    try {
      const bookingId = await createBooking();
      if (bookingId) {
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      console.error("Error preparing booking:", err);
      setBookingError(err.response?.data?.message || "Failed to prepare booking. Please try again.");
    }
  };

  const handlePaymentSuccess = () => {
    // Clear draft on successful booking
    try { sessionStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(`${DRAFT_KEY}_method`); } catch {}
    router.push(`/booking/confirmation/${existingBookingId}`);
  };

  const handleInternationalBooking = async () => {
    // Create a booking record BEFORE opening WhatsApp so the admin can track it
    let bookingId = existingBookingId;
    if (!bookingId) {
      try {
        setCreatingBooking(true);
        const response = await bookingsApi.create({
          packageId: bookingInfo.type === "package" ? bookingInfo.itemId : undefined,
          guideId: bookingInfo.type === "guide" ? bookingInfo.itemId : undefined,
          startDate: bookingInfo.startDate,
          endDate: bookingInfo.endDate,
          groupSize: bookingInfo.travelers,
          notes: bookingInfo.notes,
          isInternational: true,
        });
        const result = response.data;
        if (result.success && result.data) {
          bookingId = result.data.id;
          setExistingBookingId(bookingId!);
        }
      } catch (err: any) {
        if (err.response?.data?.data?.id) {
          bookingId = err.response.data.data.id;
          setExistingBookingId(bookingId!);
        } else {
          console.error("Failed to create international booking:", err);
          // Proceed with WhatsApp even if booking creation failed
        }
      } finally {
        setCreatingBooking(false);
      }
    }

    const message = `Hello VoyageX Team,%0A%0A*New International Booking Request*%0A%0A` +
      `Booking ID: ${bookingId || "N/A"}%0A` +
      `Package: ${bookingInfo?.itemName}%0A` +
      `Type: ${bookingInfo?.type}%0A` +
      `Duration: ${bookingInfo?.duration} days%0A` +
      `Travelers: ${bookingInfo?.travelers}%0A` +
      `Start Date: ${bookingInfo?.startDate}%0A` +
      `End Date: ${bookingInfo?.endDate}%0A` +
      `Total Amount: Rs ${bookingInfo?.total?.toLocaleString()}%0A%0A` +
      `Please assist with payment and guide assignment.`;

    window.open(`https://wa.me/923199052314?text=${message}`, "_blank");
  };

  const paymentMethods = [
    { id: "easypaisa", name: "EasyPaisa", icon: FaMobileAlt, color: "#00B050", desc: "Pay via EasyPaisa mobile wallet", local: true },
    { id: "jazzcash", name: "JazzCash", icon: FaMobileAlt, color: "#E30613", desc: "Pay via JazzCash mobile wallet", local: true },
    { id: "card", name: "Credit/Debit Card", icon: FaCreditCard, color: "#1E40AF", desc: "Visa, Mastercard", local: true },
    { id: "bank", name: "Bank Transfer", icon: FaWallet, color: "#059669", desc: "Direct bank transfer", local: true },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <FaSpinner className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!bookingInfo) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-800">No booking information found</h1>
          <button onClick={() => router.back()} className="mt-4 text-[#008A1E] hover:underline">Go Back</button>
        </div>
      </div>
    );
  }

  const commission = bookingInfo.type === "guide" ? Math.round(bookingInfo.total * 0.15) : 0;
  const guidePayout = bookingInfo.total - commission;

  // International Warning Screen
  if (showInternationalWarning) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setShowInternationalWarning(false)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <FaArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaGlobe className="w-10 h-10 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">International Booking</h2>
            <p className="text-gray-600 mb-4">
              EasyPaisa and JazzCash are Pakistan-only mobile wallets. International travelers cannot use them directly.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-yellow-800 font-medium mb-2">📋 How it works:</p>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Click the WhatsApp button below</li>
                <li>• Our team will contact you within 24 hours</li>
                <li>• We&apos;ll help with payment via international bank transfer. Contact our support team for assistance: WhatsApp: +92-319-9052314</li>
                <li>• We'll confirm your booking and assign a guide</li>
              </ul>
            </div>
            <button
              onClick={handleInternationalBooking}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 mb-3"
            >
              <FaWhatsapp className="w-5 h-5" /> Contact VoyageX Team on WhatsApp
            </button>
            <button
              onClick={() => setShowInternationalWarning(false)}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
            >
              ← Back to Payment Options
            </button>
          </div>

          <div className="mt-6 bg-blue-50 rounded-xl p-4">
            <p className="text-xs text-blue-700 text-center">
              Your booking details have been saved. Our team will assist you with payment and confirmation.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, label: "Travel Details", active: true },
              { step: 2, label: "Billing", active: true },
              { step: 3, label: "Confirmation", active: false },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s.active ? "bg-[#008A1E] text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s.step === 1 ? "✓" : s.step}
                </div>
                <span className={`text-sm ${s.active ? "text-[#008A1E] font-medium" : "text-gray-400"}`}>{s.label}</span>
                {s.step < 3 && <div className={`w-8 h-0.5 ${s.step < 2 ? "bg-[#008A1E]" : "bg-gray-200"}`}></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <FaArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Payment</h1>
              <p className="text-gray-500 text-sm mb-6">Select a payment method to continue</p>

              {/* International Traveler Warning Box */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <FaGlobe className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">International Traveler?</p>
                    <p className="text-xs text-blue-700 mt-1">
                      EasyPaisa and JazzCash are only available in Pakistan. If you're an international traveler, 
                      click below for alternative payment options.
                    </p>
                    <button
                      onClick={() => setShowInternationalWarning(true)}
                      className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <FaGlobe className="w-3 h-3" /> International Booking Assistance
                    </button>
                  </div>
                </div>
              </div>

              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
                  {bookingError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      disabled={creatingBooking}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                        selectedMethod === method.id
                          ? "border-[#008A1E] bg-[#E6F4EA]"
                          : "border-gray-200 hover:border-[#008A1E]/50"
                      } disabled:opacity-50 disabled:cursor-wait`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${method.color}15` }}>
                          <Icon className="w-5 h-5" style={{ color: method.color }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.desc}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {creatingBooking && (
                <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Preparing your booking...</span>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3">
                <FaLock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Secure Escrow Payment</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your payment of <strong>Rs {bookingInfo.total.toLocaleString()}</strong> is held securely by VoyageX.
                    {bookingInfo.type === "guide" && (
                      <> After successful trip completion, guide receives <strong>Rs {guidePayout.toLocaleString()}</strong> (85%) and VoyageX keeps <strong>Rs {commission.toLocaleString()}</strong> (15% platform fee).</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="relative h-36 rounded-lg overflow-hidden mb-4 bg-gray-200">
                <Image
                  src={bookingInfo.image}
                  alt={bookingInfo.itemName}
                  fill
                  className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                />
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{bookingInfo.itemName}</h3>
              <p className="text-xs text-gray-500 capitalize mb-4">{bookingInfo.type}</p>

              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span>Rs {bookingInfo.price.toLocaleString()} /{bookingInfo.pricingModel === "PER_DAY" ? "day" : "person"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span>{bookingInfo.duration} {bookingInfo.type === "guide" ? "days" : "days"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travelers</span>
                  <span>{bookingInfo.travelers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rs {bookingInfo.total.toLocaleString()}</span>
                </div>
                {commission > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Platform Fee (15% - held by VoyageX)</span>
                    <span>Rs {commission.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-base">
                    <span>You Pay</span>
                    <span className="text-[#008A1E]">Rs {bookingInfo.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-400 text-center">
                By proceeding, you agree to VoyageX Terms of Service
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {showPaymentModal && existingBookingId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          bookingData={{
            bookingId: existingBookingId,
            totalAmount: bookingInfo.total,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}