"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, Star, MapPin } from "lucide-react";
import { destinationsApi, packagesApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import { getImageUrl } from "@/lib/image-utils";

interface Destination {
  id: string;
  slug: string;
  name: string;
  image: string;
  rating: number;
  startingPrice: number | null;
  country: string;
  region: string;
  description: string;
  packagesCount: number;
}

const ExploreSection = () => {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoading(true);
        const [destinationsResponse, packagesResponse] = await Promise.all([
          destinationsApi.getAll({ limit: 4 }),
          packagesApi.getAll({ limit: 100 }), // Fetch all packages for price calculation
        ]);
        const result = destinationsResponse.data;
        const packageResult = packagesResponse.data;

        if (result.success && result.data) {
          const items = result.data.items || result.data || [];
          const destArray = Array.isArray(items) ? items.slice(0, 4) : [items]; // ENSURE ONLY 4
          
          const packageItems = Array.isArray(packageResult?.data?.items)
            ? packageResult.data.items
            : Array.isArray(packageResult?.data)
            ? packageResult.data
            : [];
            
          const pricingByDestination = new Map<string, { min: number; count: number }>();
          packageItems.forEach((pkg: any) => {
            const destinationId = pkg.destinationId || pkg.destinations?.id;
            if (!destinationId || typeof pkg.price !== "number") return;
            const prev = pricingByDestination.get(destinationId);
            if (!prev) {
              pricingByDestination.set(destinationId, { min: pkg.price, count: 1 });
              return;
            }
            pricingByDestination.set(destinationId, {
              min: Math.min(prev.min, pkg.price),
              count: prev.count + 1,
            });
          });

          const transformedDestinations: Destination[] = destArray.map((dest: any) => ({
            id: dest.id,
            slug: dest.slug,
            name: dest.name,
            image: getImageUrl(dest.image || dest.images?.[0]),
            rating: dest.rating || 4.5,
            startingPrice: pricingByDestination.get(dest.id)?.min ?? null,
            country: dest.country || "Pakistan",
            region: dest.region || "",
            description: dest.description || "Explore this amazing destination.",
            packagesCount: pricingByDestination.get(dest.id)?.count || dest._count?.packages || 0,
          }));

          setDestinations(transformedDestinations);
          setError(null);
        } else {
          setError(result.message || "Failed to load destinations");
        }
      } catch (err: any) {
        console.error("Error fetching destinations:", err);
        const message = err.response?.data?.message || err.message || "Failed to load destinations.";
        setError(message);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  const handleWishlist = async (e: React.MouseEvent, destinationId: string) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    try {
      if (wishlist.has(destinationId)) {
        setWishlist((prev) => {
          const next = new Set(prev);
          next.delete(destinationId);
          return next;
        });
      } else {
        setWishlist((prev) => new Set(prev).add(destinationId));
      }
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  const handleCardClick = (destination: Destination) => {
    router.push("/packages?destination=" + destination.slug);
  };

  const getRegionLabel = (region: string) => {
    return region?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  };

  if (loading) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Destinations</h1>
          <Link href="/destination" className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors">
            <span>See More</span><ArrowRight size={20} className="w-5 h-5" />
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
          <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Destinations</h1>
          <Link href="/destination" className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors">
            <span>See More</span><ArrowRight size={20} className="w-5 h-5" />
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-green-700">Try Again</button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Top Destinations</h1>
        <Link href="/destination" className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors">
          <span>See More</span><ArrowRight size={20} className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-6 2xl:gap-8 mt-6 w-full max-w-[1536px] mx-auto">
        {destinations.slice(0, 4).map((destination) => (
          <div
            key={destination.id}
            className="bg-white rounded-lg shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-2 sm:p-3 lg:p-4 cursor-pointer h-full"
            onClick={() => handleCardClick(destination)}
          >
            <div className="w-full h-[180px] sm:h-[190px] lg:h-[200px] xl:h-[210px] rounded-lg overflow-hidden relative">
              <img
                src={destination.image || "/agency-placeholder.jpg"}
                alt={destination.name}
                className="w-full h-full object-cover hover:scale-[1.05] duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
              />
              <button
                onClick={(e) => handleWishlist(e, destination.id)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
              >
                <Heart className={`w-4 h-4 ${wishlist.has(destination.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
              </button>
              {destination.region && (
                <div className="absolute bottom-3 left-3">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {getRegionLabel(destination.region)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col flex-1 mt-3">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{destination.name}</h2>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">{destination.rating.toFixed(1)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{destination.description}</p>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <div>
                  {destination.startingPrice ? (
                    <>
                      <p className="text-xs text-gray-500">From</p>
                      <p className="text-sm font-bold text-gray-900">Rs {destination.startingPrice.toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Contact for pricing</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-sm font-semibold text-[#008A1E]">{destination.packagesCount} Packages</p>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); router.push("/packages?destination=" + destination.slug); }}
                className="w-full h-[34px] bg-[#008A1E] text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors duration-300 mt-3"
              >
                View Packages
              </button>
            </div>
          </div>
        ))}
      </div>

      {destinations.length === 0 && !loading && !error && (
        <div className="text-center py-12"><p className="text-gray-500">No destinations found.</p></div>
      )}
    </section>
  );
};

export default ExploreSection;