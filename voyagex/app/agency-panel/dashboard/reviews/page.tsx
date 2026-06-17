"use client";

import { useState, useEffect } from "react";
import { FaSpinner, FaStar } from "react-icons/fa";
import { agenciesApi } from "@/lib/api";

export default function AgencyReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await agenciesApi.getMyProfile();
        const result = response.data;
        if (result.success && result.data) {
          const agencyReviews = result.data.reviews || [];
          setReviews(Array.isArray(agencyReviews) ? agencyReviews : []);
        }
      } catch (err) { console.error("Error fetching reviews:", err); }
      finally { setLoading(false); }
    };
    fetchReviews();
  }, []);

  const renderStars = (rating: number) => (
    <div className="flex">{[...Array(5)].map((_, i) => (<FaStar key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />))}</div>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><FaSpinner className="w-5 h-5 text-gray-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-xl font-semibold text-gray-900">Reviews</h1><p className="text-sm text-gray-500 mt-0.5">{reviews.length} reviews</p></div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200"><FaStar className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-500">No reviews yet</p></div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><span className="text-gray-500 font-semibold">{review.users?.firstName?.[0] || "U"}</span></div>
                <div className="flex-1">
                  <div className="flex justify-between"><h4 className="font-semibold text-gray-900">{review.users?.firstName} {review.users?.lastName}</h4><span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-1 mt-1">{renderStars(review.rating)}</div>
                  <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                  {review.packages?.title && <p className="text-xs text-gray-400 mt-1">Package: {review.packages.title}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}