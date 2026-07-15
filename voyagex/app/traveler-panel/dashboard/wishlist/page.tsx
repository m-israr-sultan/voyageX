"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FaSpinner, 
  FaHeart, 
  FaTrash, 
  FaExclamationTriangle,
  FaClock,
  FaMapMarkerAlt,
  FaStar
} from "react-icons/fa";
import { wishlistApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

export default function TravelerWishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => { 
    fetchWishlist(); 
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await wishlistApi.getAll();
      const result = response.data;
      if (result.success && result.data) {
        setItems(result.data || []);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error("Error fetching wishlist:", err);
      setError(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (packageId: string, packageName: string) => {
    setRemoveLoading(packageId);
    try { 
      await wishlistApi.remove(packageId); 
      setItems((prev) => prev.filter((item) => item.packageId !== packageId));
      setSuccessMessage(`Removed "${packageName}" from wishlist`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err) { 
      console.error("Error removing:", err);
      setError("Failed to remove item");
      setTimeout(() => setError(null), 3000);
    } finally { 
      setRemoveLoading(null); 
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <FaStar 
          key={i} 
          className={`w-3 h-3 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} 
        />
      ))}
    </div>
  );

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <div className="h-7 sm:h-8 bg-gray-200 rounded-lg w-32 sm:w-40 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-100 rounded-lg w-48 sm:w-56 mt-2 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse"></div>
              <div className="p-4 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 h-9 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-9 h-9 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error && items.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Wishlist</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Your saved packages</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load wishlist</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => fetchWishlist()} 
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
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Wishlist</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          {items.length} saved package{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {/* Error Message (non-fatal) */}
      {error && items.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Wishlist Items */}
      {items.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaHeart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">Your wishlist is empty</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Save your favorite packages to see them here
          </p>
          <Link
            href="/packages"
            className="inline-block mt-4 px-4 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006816]"
          >
            Browse Packages
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {items.map((item) => {
            const pkg = item.packages;
            const price = pkg?.price || 0;
            const rawImage = pkg?.images?.[0] || "";
            const image = rawImage ? getImageUrl(rawImage) : "/agency-placeholder.jpg";
            const destination = pkg?.destinations;
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                {/* Image Section */}
                <div 
                  className="relative h-44 sm:h-48 cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/packages/${pkg?.slug}`)}
                >
                  <img 
                    src={image} 
                    alt={pkg?.title || "Package"} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                  />
                  {pkg?.rating && pkg.rating > 0 && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1">
                      {renderStars(pkg.rating)}
                      <span className="text-white text-xs ml-1">{pkg.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4">
                  {/* Title */}
                  <h3 
                    className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1 cursor-pointer hover:text-[#008A1E] transition-colors"
                    onClick={() => router.push(`/packages/${pkg?.slug}`)}
                  >
                    {pkg?.title || "Package"}
                  </h3>
                  
                  {/* Destination */}
                  {destination && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FaMapMarkerAlt className="w-3 h-3" />
                      {destination.city}, {destination.country}
                    </p>
                  )}
                  
                  {/* Duration */}
                  {pkg?.duration && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FaClock className="w-3 h-3" />
                      {pkg.duration} days
                    </p>
                  )}
                  
                  {/* Price */}
                  <p className="text-[#008A1E] font-bold text-base sm:text-lg mt-2">
                    {price > 0 ? `Rs ${price.toLocaleString()}` : "Contact for price"}
                  </p>
                  
                  {/* Buttons */}
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => router.push(`/packages/${pkg?.slug}`)} 
                      className="flex-1 py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006816] transition-colors"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => handleRemove(item.packageId, pkg?.title || "Package")} 
                      disabled={removeLoading === item.packageId}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      title="Remove from wishlist"
                    >
                      {removeLoading === item.packageId ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}