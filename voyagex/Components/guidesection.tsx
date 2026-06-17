"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MapPin, CheckCircle } from "lucide-react";

import { guidesApi, messagesApi } from "../lib/api";

interface Guide {
  id: string;
  slug: string;
  name: string;
  location: string;
  image: string;
  pricePerDay: number;
  specialty: string;
  rating: number;
  isVerified: boolean;
}

const GuidesSection = () => {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setLoading(true);
        const response = await guidesApi.getAll({ limit: 4 });
        const result = response.data;

        if (result.success && result.data) {
          const items = result.data.items || result.data || [];
          const guidesArray = Array.isArray(items) ? items.slice(0, 4) : [items]; // ENSURE ONLY 4

          const transformedGuides: Guide[] = guidesArray.map((guide: any) => {
            const userData = guide.users || {};
            
            return {
              id: guide.id,
              slug: guide.slug,
              name: userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}`
                : userData.firstName || "Tour Guide",
              location: guide.location || "Pakistan",
              image: userData.avatar || "/guid-placeholder.jpg",
              pricePerDay: guide.pricePerDay || 0,
              specialty: guide.specialities?.[0] || "Tour Guide",
              rating: guide.rating || 0,
              isVerified: guide.isVerified || false,
            };
          });

          setGuides(transformedGuides);
          setError(null);
        } else {
          setError(result.message || "Failed to load guides");
        }
      } catch (err: any) {
        console.error("Error fetching guides:", err);
        const message = err.response?.data?.message || err.message || "Failed to load guides.";
        setError(message);
        setGuides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, []);

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`text-lg ${index < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleCardClick = (guide: Guide) => {
    router.push(`/guide/${guide.slug}`);
  };

  const handleMessageClick = async (guideId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await messagesApi.createConversation({ recipientId: guideId });
      const result = response.data;
      if (result.success && result.data) {
        const conversationId = result.data.id;
        router.push(`/message/${conversationId}`);
      }
    } catch (err: any) {
      console.error("Failed to create conversation:", err);
      router.push(`/message/${guideId}`);
    }
  };

  if (loading) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
            Guides
          </h1>
          <Link
            href="/guide"
            className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
          >
            <span>See More</span>
            <ArrowRight size={20} className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E]"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
            Guides
          </h1>
          <Link
            href="/guide"
            className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
          >
            <span>See More</span>
            <ArrowRight size={20} className="w-5 h-5" />
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
          Guides
        </h1>
        <Link
          href="/guide"
          className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
        >
          <span>See More</span>
          <ArrowRight size={20} className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-6 2xl:gap-8 mt-6 w-full max-w-[1536px] mx-auto">
        {guides.slice(0, 4).map((guide) => (
          <div
            key={guide.id}
            className="h-[420px] bg-white rounded-lg shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-2 sm:p-3 lg:p-4 cursor-pointer"
            onClick={() => handleCardClick(guide)}
          >
            <div className="w-full h-[180px] sm:h-[190px] lg:h-[200px] xl:h-[210px] rounded-lg overflow-hidden relative mb-3">
              <img
                src={guide.image}
                alt={guide.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/guid-placeholder.jpg";
                }}
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{guide.name}</h2>
                {guide.isVerified && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
              <p className="text-gray-600 text-sm mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                {guide.location}
              </p>
            </div>

            <div className="flex flex-row justify-between items-center w-full mt-4">
              <p className="text-gray-700">Rating</p>
              <div className="w-[100px]">{renderStars(guide.rating)}</div>
            </div>

            <div className="flex-1 flex flex-col justify-end mt-2">
              <div className="flex flex-row justify-between w-full mb-2">
                <p className="text-sm text-gray-600">Price Per Day</p>
                <p className="text-sm text-gray-600">Specialty</p>
              </div>

              <div className="flex flex-row justify-between w-full mb-4">
                <span className="text-lg font-bold">
                  {guide.pricePerDay > 0 ? `${guide.pricePerDay.toLocaleString()} PKR` : "Contact for price"}
                </span>
                <span className="text-lg font-bold">{guide.specialty}</span>
              </div>

              <div className="flex flex-row gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(guide);
                  }}
                  className="w-1/2 h-[31px] bg-[#008A1E] text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-300"
                >
                  View Profile
                </button>
                <button
                  onClick={(e) => handleMessageClick(guide.id, e)}
                  className="w-1/2 h-[31px] bg-[#E6F4EA] text-black font-medium rounded-lg hover:bg-green-100 transition-colors duration-300"
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {guides.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500">No guides found.</p>
        </div>
      )}
    </section>
  );
};

export default GuidesSection;