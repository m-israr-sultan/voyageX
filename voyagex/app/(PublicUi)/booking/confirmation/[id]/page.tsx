"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  FaCheckCircle,
  FaHome,
  FaCalendarAlt,
  FaEnvelope,
  FaSpinner,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { bookingsApi } from "@/lib/api";

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bookingId = params.id as string;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await bookingsApi.getById(bookingId);
        const result = response.data;
        if (result.success && result.data) {
          setBooking(result.data);
        } else {
          setError("Booking not found");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load booking");
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="text-center py-20">
          <FaSpinner className="w-10 h-10 text-[#008A1E] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-800">Booking Not Found</h1>
          <p className="text-gray-600 mt-2">{error || "The booking you're looking for doesn't exist."}</p>
          <button onClick={() => router.push("/")} className="mt-6 px-6 py-3 bg-[#008A1E] text-white rounded-xl">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const pkg = booking.packages;

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-[#008A1E] to-green-600 py-12 text-center">
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6">
                <FaCheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Booking Confirmed!</h1>
              <p className="text-white/90 text-lg">Your adventure awaits</p>
            </div>

            <div className="p-8">
              {/* Booking ID */}
              <div className="text-center mb-6">
                <p className="text-gray-500">Booking ID</p>
                <p className="text-2xl font-bold text-[#008A1E]">{booking.id}</p>
              </div>

              {/* Status Badge */}
              <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${
                booking.status === "CONFIRMED" ? "bg-green-50" :
                booking.status === "PENDING" ? "bg-yellow-50" : "bg-blue-50"
              }`}>
                <FaCheckCircle className={`w-6 h-6 ${
                  booking.status === "CONFIRMED" ? "text-green-600" :
                  booking.status === "PENDING" ? "text-yellow-600" : "text-blue-600"
                }`} />
                <div>
                  <p className="font-medium">
                    {booking.status === "CONFIRMED" ? "Booking Confirmed!" :
                     booking.status === "PENDING" ? "Awaiting Provider Confirmation" :
                     `Status: ${booking.status}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.status === "CONFIRMED" ? "Your trip is all set. The provider will contact you soon." :
                     booking.status === "PENDING" ? "The guide/agency will confirm your booking shortly. You'll be notified." :
                     "A confirmation email has been sent."}
                  </p>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="border-t pt-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package</span>
                    <span className="font-medium">{pkg?.title || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dates</span>
                    <span className="font-medium">
                      {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{pkg?.duration || "N/A"} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Group Size</span>
                    <span className="font-medium">{booking.groupSize} person(s)</span>
                  </div>
                  {booking.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes</span>
                      <span className="font-medium text-sm">{booking.notes}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-lg font-semibold">Total Paid</span>
                    <span className="text-lg font-bold text-[#008A1E]">
                      Rs {booking.totalPrice?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-3">What's Next?</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <FaEnvelope className="text-[#008A1E]" /> Confirmation email sent to your registered email
                  </li>
                  <li className="flex items-center gap-2">
                    <FaCalendarAlt className="text-[#008A1E]" /> Provider will contact you within 24 hours
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push("/traveler-panel/dashboard/bookings")}
                  className="flex-1 py-3 bg-[#008A1E] text-white font-semibold rounded-xl hover:bg-[#006816] flex items-center justify-center gap-2"
                >
                  <FaCalendarAlt /> View My Bookings
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <FaHome /> Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}