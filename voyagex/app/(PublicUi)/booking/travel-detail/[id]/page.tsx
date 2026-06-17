"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { FaArrowLeft, FaCalendarAlt, FaUsers, FaSpinner } from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { guidesApi, packagesApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

export default function TravelDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<any>(null);
  const [itemType, setItemType] = useState<"guide" | "package">("package");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    travelers: 1,
    notes: "",
  });

  const id = params.id as string;

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const typeParam = new URLSearchParams(window.location.search).get("type") || "package";
      setItemType(typeParam as "guide" | "package");

      if (typeParam === "guide") {
        const response = await guidesApi.getBySlug(id);
        if (response.data.success) setItem(response.data.data);
      } else {
        const response = await packagesApi.getBySlug(id);
        if (response.data.success) setItem(response.data.data);
      }
    } catch (err: any) {
      setError("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.endDate) {
      setError("Please select dates");
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError("End date must be after start date");
      return;
    }

    const duration = Math.max(1, Math.ceil(
      (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Traveler pays base price (what guide charges)
    let total = 0;
    if (itemType === "guide") {
      total = (item?.pricePerDay || 0) * duration;
    } else {
      total = (item?.price || 0) * formData.travelers;
    }

    const queryParams = new URLSearchParams({
      type: itemType,
      itemId: item?.id || id,
      itemName: itemType === "guide"
        ? `${item?.users?.firstName || ""} ${item?.users?.lastName || ""}`.trim()
        : item?.title || "",
      price: itemType === "guide" ? (item?.pricePerDay || 0).toString() : (item?.price || 0).toString(),
      duration: duration.toString(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      travelers: formData.travelers.toString(),
      notes: formData.notes,
      total: total.toString(),
      image: itemType === "guide"
        ? (item?.users?.avatar || "/guid-placeholder.jpg")
        : (item?.images?.[0] || "/agency-placeholder.jpg"),
    });

    router.push(`/booking/billing-detail/${item?.id || id}?${queryParams.toString()}`);
  };

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

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-800">{error || "Not found"}</h1>
          <button onClick={() => router.back()} className="mt-4 text-[#008A1E] hover:underline">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const itemName = itemType === "guide"
    ? `${item?.users?.firstName || ""} ${item?.users?.lastName || ""}`.trim()
    : item?.title || "";

  const itemImage = itemType === "guide"
    ? item?.users?.avatar || "/guid-placeholder.jpg"
    : item?.images?.[0] || "/agency-placeholder.jpg";

  const itemPrice = itemType === "guide" ? item?.pricePerDay || 0 : item?.price || 0;
  
  const calculatedDuration = formData.startDate && formData.endDate
    ? Math.max(1, Math.ceil(
        (new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ))
    : 1;

  // Traveler pays base price (what guide charges)
  const estimatedTotal = itemType === "guide"
    ? itemPrice * calculatedDuration
    : itemPrice * formData.travelers;

  const pricingLabel = itemType === "guide" ? "per day" : "per person";

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { step: 1, label: "Travel Details", active: true },
              { step: 2, label: "Billing", active: false },
              { step: 3, label: "Confirmation", active: false },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  s.active ? "bg-[#008A1E] text-white" : "bg-gray-200 text-gray-500"
                }`}>
                  {s.step}
                </div>
                <span className={`text-sm ${s.active ? "text-[#008A1E] font-medium" : "text-gray-400"}`}>
                  {s.label}
                </span>
                {s.step < 3 && <div className="w-8 h-0.5 bg-gray-200"></div>}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Travel Details</h1>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate || new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Travelers</label>
                  <div className="relative">
                    <FaUsers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="number"
                      name="travelers"
                      value={formData.travelers}
                      onChange={handleChange}
                      min={1}
                      max={itemType === "guide" ? 20 : item?.maxGroupSize || 20}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                    />
                  </div>
                  {itemType === "guide" && (
                    <p className="text-xs text-gray-500 mt-1">Guide pricing is per day, not per traveler. You pay the guide's daily rate.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any special requirements..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#008A1E]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#008A1E] text-white font-semibold rounded-lg hover:bg-[#006816] transition-colors"
                >
                  Continue to Billing
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="relative h-40 rounded-lg overflow-hidden mb-4 bg-gray-200">
                <Image src={itemImage} alt={itemName} fill className="object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }} />
              </div>

              <h3 className="font-bold text-gray-900 mb-1">{itemName}</h3>
              <p className="text-sm text-gray-500 capitalize mb-4">{itemType}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-medium">Rs {itemPrice.toLocaleString()} <span className="text-xs text-gray-400">/{pricingLabel}</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{calculatedDuration} {itemType === "guide" ? "days" : "days"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Travelers</span>
                  <span className="font-medium">{formData.travelers}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>You Pay</span>
                    <span className="text-[#008A1E]">Rs {estimatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {itemType === "guide" && (
                <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                  <p className="font-medium mb-1">How it works:</p>
                  <p>You pay: Rs {itemPrice.toLocaleString()} × {calculatedDuration} days = Rs {estimatedTotal.toLocaleString()}</p>
                  <p className="mt-1">VoyageX holds your payment securely and releases 85% to the guide after successful trip completion.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}