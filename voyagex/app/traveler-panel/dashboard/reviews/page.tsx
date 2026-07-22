"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaSpinner, 
  FaStar, 
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaCalendarAlt,
  FaBoxOpen
} from "react-icons/fa";
import { usersApi, reviewsApi } from "@/lib/api";

export default function TravelerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getMyReviews();
      const result = response.data;
      if (result.success && result.data) {
        setReviews(result.data || []);
      } else {
        setReviews([]);
      }
    } catch (err: any) {
      console.error("Error fetching reviews:", err);
      setError(err.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return;
    
    setDeleteLoading(reviewId);
    try {
      await reviewsApi.delete(reviewId);
      setSuccessMessage("Review deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchReviews();
    } catch (err: any) {
      console.error("Error deleting review:", err);
      setError(err.response?.data?.message || "Failed to delete review");
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleteLoading(null);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <FaStar 
          key={i} 
          className={`w-3 h-3 sm:w-4 sm:h-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
        />
      ))}
    </div>
  );

  // Calculate statistics
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
    : 0;
  
  const ratingDistribution = {
    5: reviews.filter(r => (r.rating || 0) >= 5).length,
    4: reviews.filter(r => (r.rating || 0) >= 4 && (r.rating || 0) < 5).length,
    3: reviews.filter(r => (r.rating || 0) >= 3 && (r.rating || 0) < 4).length,
    2: reviews.filter(r => (r.rating || 0) >= 2 && (r.rating || 0) < 3).length,
    1: reviews.filter(r => (r.rating || 0) >= 1 && (r.rating || 0) < 2).length,
  };

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="h-8 w-8 bg-gray-200 rounded-full mx-auto mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-1 animate-pulse"></div>
              <div className="h-3 bg-gray-100 rounded w-24 mx-auto animate-pulse"></div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error && reviews.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Reviews</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your reviews</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load reviews</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchReviews()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Reviews</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {reviews.length} review{reviews.length !== 1 ? 's' : ''} written
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message (non-fatal) */}
      {error && reviews.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Statistics Section (if reviews exist) */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Your Review Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
              <div className="flex justify-center mt-1">{renderStars(Math.round(averageRating))}</div>
              <p className="text-xs text-gray-500 mt-1">Average Rating</p>
            </div>
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{ratingDistribution[star as keyof typeof ratingDistribution]}</div>
                <div className="flex justify-center mt-1">
                  {[...Array(star)].map((_, i) => (
                    <FaStar key={i} className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{star} Star</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaStar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">No reviews yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            You haven't written any reviews yet
          </p>
          <Link
            href="/packages"
            className="inline-block mt-4 px-4 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006816]"
          >
            Book a Tour to Review
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-500 font-semibold text-sm">
                    {review.users?.firstName?.[0] || review.users?.lastName?.[0] || "U"}
                  </span>
                </div>
                
                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                        {review.packages?.title || "Tour Package"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-xs text-gray-400">
                          <FaCalendarAlt className="inline w-3 h-3 mr-1" />
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deleteLoading === review.id}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete Review"
                      >
                        {deleteLoading === review.id ? (
                          <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                          <FaTrash className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-700 text-sm mt-3 leading-relaxed">
                      {review.comment}
                    </p>
                  )}
                  
                  {/* Link to Package */}
                  <Link
                    href={`/packages/${review.packages?.slug}`}
                    className="inline-flex items-center gap-1 text-xs text-[#008A1E] hover:underline mt-3"
                  >
                    <FaBoxOpen className="w-3 h-3" /> View Package
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}