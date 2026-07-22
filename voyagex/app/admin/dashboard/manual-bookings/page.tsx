"use client";

import { useState, useEffect } from "react";
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationTriangle, 
  FaClock,
  FaWhatsapp,
  FaMoneyBillWave,
  FaUserCheck,
  FaEye,
  FaCalendarAlt,
  FaGlobe,
} from "react-icons/fa";
import { adminApi } from "@/lib/api";

interface ManualBooking {
  id: string;
  userId: string;
  packageId: string;
  totalPrice: number;
  startDate: string;
  endDate: string;
  groupSize: number;
  notes: string;
  isInternational: boolean;
  internationalBookingStatus: string;
  whatsappConversationId: string;
  createdAt: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  packages: {
    title: string;
    destinations: {
      name: string;
      city: string;
      country: string;
    };
  };
}

interface Guide {
  id: string;
  slug: string;
  users: {
    firstName: string;
    lastName: string;
    avatar: string;
  };
  pricePerDay: number;
  location: string;
}

export default function ManualBookingsPage() {
  const [bookings, setBookings] = useState<ManualBooking[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<ManualBooking | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAssignGuideModal, setShowAssignGuideModal] = useState(false);
  const [whatsappId, setWhatsappId] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [selectedGuideId, setSelectedGuideId] = useState("");
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookingsRes, guidesRes] = await Promise.all([
        adminApi.getManualBookings(),
        adminApi.getAllGuides(),
      ]);
      
      if (bookingsRes.data?.success) {
        setBookings(bookingsRes.data.data || []);
      }
      if (guidesRes.data?.success) {
        setGuides(guidesRes.data.data || []);
      }
    } catch (err: any) {
      console.error("Error fetching International Bookings:", err);
      setError(err.response?.data?.message || "Failed to load International Bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignWhatsApp = async () => {
    if (!selectedBooking) return;
    if (!whatsappId.trim()) {
      setError("WhatsApp conversation ID is required");
      return;
    }

    setActionLoading(selectedBooking.id);
    setError(null);
    try {
      const response = await adminApi.assignWhatsAppToManualBooking({
        bookingId: selectedBooking.id,
        whatsappId: whatsappId,
        notes: adminNote,
      });
      const result = response.data;
      if (result.success) {
        setSuccessMessage("WhatsApp conversation assigned successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowWhatsAppModal(false);
        setSelectedBooking(null);
        setWhatsappId("");
        setAdminNote("");
        fetchData();
      } else {
        setError(result.message || "Failed to assign WhatsApp");
      }
    } catch (err: any) {
      console.error("Error assigning WhatsApp:", err);
      setError(err.response?.data?.message || "Failed to assign WhatsApp");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkPaymentReceived = async () => {
    if (!selectedBooking) return;
    if (!transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    setActionLoading(selectedBooking.id);
    setError(null);
    try {
      const response = await adminApi.markManualBookingPaid({
        bookingId: selectedBooking.id,
        transactionId: transactionId,
        notes: adminNote,
      });
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Payment marked as received!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowPaymentModal(false);
        setSelectedBooking(null);
        setTransactionId("");
        setAdminNote("");
        fetchData();
      } else {
        setError(result.message || "Failed to mark payment");
      }
    } catch (err: any) {
      console.error("Error marking payment:", err);
      setError(err.response?.data?.message || "Failed to mark payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignGuide = async () => {
    if (!selectedBooking) return;
    if (!selectedGuideId) {
      setError("Please select a guide");
      return;
    }

    setActionLoading(selectedBooking.id);
    setError(null);
    try {
      const response = await adminApi.assignGuideToManualBooking({
        bookingId: selectedBooking.id,
        guideId: selectedGuideId,
        notes: adminNote,
      });
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Guide assigned successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
        setShowAssignGuideModal(false);
        setSelectedBooking(null);
        setSelectedGuideId("");
        setAdminNote("");
        fetchData();
      } else {
        setError(result.message || "Failed to assign guide");
      }
    } catch (err: any) {
      console.error("Error assigning guide:", err);
      setError(err.response?.data?.message || "Failed to assign guide");
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (bookingId: string) => {
    setActionLoading(bookingId);
    setError(null);
    try {
      const response = await adminApi.completeManualBooking(bookingId);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Booking marked as completed!");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData();
      } else {
        setError(result.message || "Failed to complete booking");
      }
    } catch (err: any) {
      console.error("Error completing booking:", err);
      setError(err.response?.data?.message || "Failed to complete booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    
    setActionLoading(bookingId);
    setError(null);
    try {
      const response = await adminApi.cancelManualBooking(bookingId);
      const result = response.data;
      if (result.success) {
        setSuccessMessage("Booking cancelled!");
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchData();
      } else {
        setError(result.message || "Failed to cancel booking");
      }
    } catch (err: any) {
      console.error("Error cancelling booking:", err);
      setError(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      PENDING_REVIEW: { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: FaClock },
      AWAITING_PAYMENT: { label: "Awaiting Payment", color: "bg-orange-100 text-orange-700", icon: FaMoneyBillWave },
      PAYMENT_RECEIVED: { label: "Payment Received", color: "bg-blue-100 text-blue-700", icon: FaCheckCircle },
      GUIDE_ASSIGNED: { label: "Guide Assigned", color: "bg-purple-100 text-purple-700", icon: FaUserCheck },
      COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700", icon: FaCheckCircle },
      CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700", icon: FaTimesCircle },
    };
    const config = statusMap[status] || { label: status, color: "bg-gray-100 text-gray-700", icon: FaClock };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" /> {config.label}
      </span>
    );
  };

  const filteredBookings = filter === "ALL" 
    ? bookings 
    : bookings.filter(b => b.internationalBookingStatus === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.internationalBookingStatus === "PENDING_REVIEW").length,
    awaitingPayment: bookings.filter(b => b.internationalBookingStatus === "AWAITING_PAYMENT").length,
    paymentReceived: bookings.filter(b => b.internationalBookingStatus === "PAYMENT_RECEIVED").length,
    completed: bookings.filter(b => b.internationalBookingStatus === "COMPLETED").length,
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-48 sm:w-56 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-64 sm:w-80 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-lg border p-2 sm:p-3">
              <div className="h-5 sm:h-7 bg-gray-200 rounded w-8 sm:w-12 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-12 sm:w-16 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">International Bookings</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Manage international traveler bookings and manual payment processing
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-3 text-center">
          <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
          <p className="text-xs text-yellow-600">Pending</p>
        </div>
        <div className="bg-orange-50 rounded-xl border border-orange-200 p-3 text-center">
          <p className="text-xl font-bold text-orange-700">{stats.awaitingPayment}</p>
          <p className="text-xs text-orange-600">Awaiting Payment</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 text-center">
          <p className="text-xl font-bold text-blue-700">{stats.paymentReceived}</p>
          <p className="text-xs text-blue-600">Payment Received</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-200 p-3 text-center">
          <p className="text-xl font-bold text-green-700">{stats.completed}</p>
          <p className="text-xs text-green-600">Completed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {["ALL", "PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_RECEIVED", "GUIDE_ASSIGNED", "COMPLETED"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === status
                ? "bg-[#008A1E] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {status === "ALL" ? "All" : status.replace(/_/g, " ")}
          </button>
        ))}
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

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
          <FaGlobe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-700">No International Bookings</h3>
          <p className="text-xs text-gray-500 mt-1">No bookings in this category</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                {/* Booking Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {booking.packages?.title || "Tour Package"}
                    </h3>
                    {getStatusBadge(booking.internationalBookingStatus)}
                    {booking.isInternational && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <FaGlobe className="w-3 h-3" /> International
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                    <p>Traveler: {booking.users?.firstName} {booking.users?.lastName}</p>
                    <p>Email: {booking.users?.email}</p>
                    <p>Phone: {booking.users?.phone || "Not provided"}</p>
                    <p>Group Size: {booking.groupSize} persons</p>
                    <p>Dates: {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                    <p className="font-medium text-gray-900">Amount: Rs {booking.totalPrice?.toLocaleString()}</p>
                  </div>
                  
                  {booking.whatsappConversationId && (
                    <p className="text-xs text-green-600 mt-2">
                      WhatsApp: {booking.whatsappConversationId}
                    </p>
                  )}
                  
                  {booking.notes && (
                    <p className="text-xs text-gray-400 mt-1">Note: {booking.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row flex-wrap lg:flex-col gap-2">
                  {booking.internationalBookingStatus === "PENDING_REVIEW" && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowWhatsAppModal(true);
                      }}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center gap-1"
                    >
                      <FaWhatsapp className="w-3 h-3" /> Assign WhatsApp
                    </button>
                  )}
                  
                  {booking.internationalBookingStatus === "AWAITING_PAYMENT" && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                    >
                      <FaMoneyBillWave className="w-3 h-3" /> Mark Payment Received
                    </button>
                  )}
                  
                  {booking.internationalBookingStatus === "PAYMENT_RECEIVED" && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowAssignGuideModal(true);
                      }}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 flex items-center gap-1"
                    >
                      <FaUserCheck className="w-3 h-3" /> Assign Guide
                    </button>
                  )}
                  
                  {booking.internationalBookingStatus === "GUIDE_ASSIGNED" && (
                    <button
                      onClick={() => handleComplete(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === booking.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaCheckCircle className="w-3 h-3" />}
                      Mark Complete
                    </button>
                  )}
                  
                  {booking.internationalBookingStatus !== "COMPLETED" && booking.internationalBookingStatus !== "CANCELLED" && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={actionLoading === booking.id}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {actionLoading === booking.id ? <FaSpinner className="w-3 h-3 animate-spin" /> : <FaTimesCircle className="w-3 h-3" />}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WhatsApp Assignment Modal */}
      {showWhatsAppModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Assign WhatsApp Conversation</h3>
              <button onClick={() => setShowWhatsAppModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{selectedBooking.users?.firstName} {selectedBooking.users?.lastName}</p>
                <p className="text-xs text-gray-500">{selectedBooking.packages?.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Conversation ID *</label>
                <input
                  type="text"
                  value={whatsappId}
                  onChange={(e) => setWhatsappId(e.target.value)}
                  placeholder="Enter WhatsApp conversation ID"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowWhatsAppModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button onClick={handleAssignWhatsApp} disabled={actionLoading === selectedBooking.id} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === selectedBooking.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaWhatsapp className="w-4 h-4" />} Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Received Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Mark Payment Received</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{selectedBooking.users?.firstName} {selectedBooking.users?.lastName}</p>
                <p className="text-xs text-gray-500">Amount: Rs {selectedBooking.totalPrice?.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID *</label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction reference"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button onClick={handleMarkPaymentReceived} disabled={actionLoading === selectedBooking.id} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === selectedBooking.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaMoneyBillWave className="w-4 h-4" />} Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Guide Modal */}
      {showAssignGuideModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Assign Guide</h3>
              <button onClick={() => setShowAssignGuideModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Guide *</label>
                <select
                  value={selectedGuideId}
                  onChange={(e) => setSelectedGuideId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a guide</option>
                  {guides.map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.users?.firstName} {guide.users?.lastName} - {guide.location} (Rs {guide.pricePerDay}/day)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note (Optional)</label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAssignGuideModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
                <button onClick={handleAssignGuide} disabled={actionLoading === selectedBooking.id} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actionLoading === selectedBooking.id ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaUserCheck className="w-4 h-4" />} Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
