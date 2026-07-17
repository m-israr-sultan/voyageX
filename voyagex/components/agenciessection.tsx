"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, CheckCircle } from "lucide-react";
import { agenciesApi } from "../lib/api";
import { getImageUrl } from "../lib/image-utils";

interface Agency {
  id: string;
  slug: string;
  name: string;
  location: string;
  logo: string;
  status: string;
  packageCount: number;
  rating: number;
  isVerified: boolean;
}

const AgenciesSection = () => {
  const router   = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        setLoading(true);
        // Backend now returns { success, data: { items, total, ... } }
        const response = await agenciesApi.getAll({ limit: 4, isVerified: true });
        const result   = response.data;

        if (result.success && result.data) {
          // items array lives under result.data.items (paginated) or result.data if flat
          const raw: any[] = result.data.items ?? (Array.isArray(result.data) ? result.data : []);
          const transformed: Agency[] = raw.slice(0, 4).map((agency: any) => ({
            id:           agency.id,
            slug:         agency.slug,
            name:         agency.name ?? "Agency",
            location:     [agency.city, agency.country].filter(Boolean).join(", ") || "Pakistan",
            logo:         agency.logo ? getImageUrl(agency.logo) : "/agency-placeholder.jpg",
            status:       agency.isVerified ? "Verified" : "Pending",
            packageCount: agency._count?.packages ?? 0,
            rating:       agency.rating ?? 0,
            isVerified:   agency.isVerified ?? false,
          }));
          setAgencies(transformed);
          setError(null);
        } else {
          setError(result.message ?? "Failed to load agencies");
        }
      } catch (err: any) {
        const message = err.response?.data?.message ?? err.message ?? "Failed to load agencies.";
        setError(message);
        setAgencies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  const renderStars = (rating: number = 0) => (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <span key={index} className={`text-sm ${index < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}`}>
          ★
        </span>
      ))}
    </div>
  );

  const handleViewPackages = (agency: Agency, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/agency/${agency.slug}?tab=packages`);
  };

  const handleViewDetails = (agency: Agency, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/agency/${agency.slug}`);
  };

  // ─── Section header (shared) ──────────────────────────────────────────────

  const SectionHeader = () => (
    <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
      <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
        Agencies
      </h1>
      <button
        onClick={() => router.push("/agency")}
        className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
      >
        <span>See More</span>
        <ArrowRight size={20} className="w-5 h-5" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <SectionHeader />
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-6 2xl:gap-8 mt-6 w-full max-w-[1536px] mx-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-3 animate-pulse">
              <div className="w-full h-[200px] rounded-lg bg-gray-200 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-200 rounded-lg" />
                <div className="flex-1 h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <SectionHeader />
        <div className="text-center py-12">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-green-700 text-sm"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <SectionHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-6 2xl:gap-8 mt-6 w-full max-w-[1536px] mx-auto">
        {agencies.map((agency) => (
          <div
            key={agency.id}
            className="bg-white rounded-lg shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-2 sm:p-3 lg:p-4 cursor-pointer"
            onClick={() => router.push(`/agency/${agency.slug}`)}
          >
            {/* Agency image */}
            <div className="w-full h-[180px] sm:h-[190px] lg:h-[200px] xl:h-[210px] rounded-lg overflow-hidden relative mb-3 bg-gray-100">
              <img
                src={agency.logo || "/agency-placeholder.jpg"}
                alt={agency.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
              />
              {agency.isVerified && (
                <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                  ✓ Verified
                </span>
              )}
            </div>

            {/* Name + verified */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold line-clamp-1">{agency.name}</h2>
              {agency.isVerified && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />}
            </div>

            {/* Location */}
            <p className="text-gray-600 text-sm mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" />
              <span className="truncate">{agency.location}</span>
            </p>

            {/* Rating */}
            <div className="flex flex-row justify-between items-center w-full mt-4">
              <p className="text-gray-700 text-sm">Rating</p>
              <div>{renderStars(agency.rating)}</div>
            </div>

            {/* Status / Tours */}
            <div className="flex-1 flex flex-col justify-end mt-2">
              <div className="flex flex-row justify-between w-full mb-1">
                <p className="text-sm text-gray-600">Status</p>
                <p className="text-sm text-gray-600">Packages</p>
              </div>
              <div className="flex flex-row justify-between w-full mb-4">
                <span className="text-lg font-bold">{agency.status}</span>
                <span className="text-lg font-bold">{agency.packageCount}</span>
              </div>
              <div className="flex flex-row gap-3">
                {agency.packageCount > 0 && (
                  <button
                    onClick={(e) => handleViewPackages(agency, e)}
                    className="w-1/2 h-[31px] bg-[#008A1E] text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-300 text-sm"
                  >
                    View Packages
                  </button>
                )}
                <button
                  onClick={(e) => handleViewDetails(agency, e)}
                  className={`${agency.packageCount > 0 ? "w-1/2" : "w-full"} h-[31px] bg-[#E6F4EA] text-black font-medium rounded-lg hover:bg-green-100 transition-colors duration-300 text-sm`}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agencies.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-sm">No verified agencies found.</p>
        </div>
      )}
    </section>
  );
};

export default AgenciesSection;