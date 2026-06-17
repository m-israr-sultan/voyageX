"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FaSpinner, 
  FaUser, 
  FaStar, 
  FaMapMarkerAlt, 
  FaExclamationTriangle,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaLanguage,
  FaBriefcase,
} from "react-icons/fa";
import { agenciesApi } from "@/lib/api";

export default function AgencyGuidesPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState("");

  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await agenciesApi.getMyProfile();
        const result = response.data;
        if (result.success && result.data) {
          const agencyGuides = result.data.guides || [];
          setGuides(Array.isArray(agencyGuides) ? agencyGuides : []);
          setAgencyName(result.data.name || "Agency");
        }
      } catch (err: any) { 
        console.error("Error fetching guides:", err);
        setError(err.response?.data?.message || "Failed to load guides"); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchGuides();
  }, []);

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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-32 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Guides</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Guides associated with {agencyName}</p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
          <FaExclamationTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-red-800">Unable to load guides</h3>
          <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    total: guides.length,
    verified: guides.filter((g) => g.isVerified).length,
    unverified: guides.filter((g) => !g.isVerified).length,
    avgRating: guides.length > 0 
      ? (guides.reduce((sum, g) => sum + (g.rating || 0), 0) / guides.length).toFixed(1)
      : 0,
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Guides</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Guides associated with {agencyName} ({guides.length} guide{guides.length !== 1 ? 's' : ''})
        </p>
      </div>

      {/* Stats Cards */}
      {guides.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500">Total Guides</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{stats.verified}</p>
            <p className="text-xs text-gray-500">Verified</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.unverified}</p>
            <p className="text-xs text-gray-500">Pending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 text-center">
            <p className="text-xl sm:text-2xl font-bold text-[#008A1E]">{stats.avgRating}</p>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </div>
        </div>
      )}

      {/* Guides List */}
      {guides.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
          <FaUser className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-gray-700">No guides yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Guides register independently on VoyageX and request to join your agency.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Once they request, you'll see them here for approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide: any) => {
            const user = guide.users || {};
            const hasLanguages = guide.languages?.length > 0;
            const hasSpecialities = guide.specialities?.length > 0;
            
            return (
              <div 
                key={guide.id} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header with Avatar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      <img 
                        src={user.avatar || "/guid-placeholder.jpg"} 
                        alt={user.firstName} 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {user.firstName} {user.lastName}
                        </h3>
                        {guide.isVerified ? (
                          <FaCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" title="Verified Guide" />
                        ) : (
                          <FaTimesCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Not Verified" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <FaMapMarkerAlt className="w-3 h-3" />
                        {guide.location || "Location not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  {/* Rating */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Rating</span>
                    <div className="flex items-center gap-1">
                      {renderStars(guide.rating || 0)}
                      <span className="text-xs text-gray-500 ml-1">({guide.totalReviews || 0})</span>
                    </div>
                  </div>

                  {/* Price Per Day */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Price / Day</span>
                    <span className="font-semibold text-gray-900 text-sm">
                      Rs {(guide.pricePerDay || 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Experience */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FaBriefcase className="w-3 h-3" /> Experience
                    </span>
                    <span className="text-sm text-gray-700">{guide.experience || 0} years</span>
                  </div>

                  {/* Languages - Show first 2 */}
                  {hasLanguages && (
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaLanguage className="w-3 h-3" /> Languages
                      </span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {guide.languages.slice(0, 2).map((lang: string, i: number) => (
                          <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {lang}
                          </span>
                        ))}
                        {guide.languages.length > 2 && (
                          <span className="text-xs text-gray-400">+{guide.languages.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Specialities - Show first 2 */}
                  {hasSpecialities && (
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-gray-500">Specialities</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {guide.specialities.slice(0, 2).map((spec: string, i: number) => (
                          <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                            {spec}
                          </span>
                        ))}
                        {guide.specialities.length > 2 && (
                          <span className="text-xs text-gray-400">+{guide.specialities.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Status</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        guide.isAvailable !== false 
                          ? "bg-green-100 text-green-700" 
                          : "bg-red-100 text-red-700"
                      }`}>
                        {guide.isAvailable !== false ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/guide/${guide.slug}`}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                  >
                    <FaEye className="w-3 h-3" /> View Full Profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <FaUser className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-800">About Agency Guides</h4>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li>• Guides register independently on VoyageX and can request to join your agency</li>
              <li>• Once approved, they appear in your agency's guide list</li>
              <li>• Guides can be associated with multiple agencies</li>
              <li>• You can view guide profiles but cannot edit their personal information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}