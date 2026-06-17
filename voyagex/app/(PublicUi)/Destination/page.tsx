"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSearch,
  FaChevronDown,
  FaStar,
  FaArrowRight,
  FaMapMarkerAlt,
  FaHeart,
  FaFilter,
  FaTimes,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { destinationsApi, packagesApi } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";

interface Destination {
  id: string;
  name: string;
  slug: string;
  image: string;
  rating: number;
  startingPrice: number | null;
  packages: number;
  region: string;
  description: string;
  city?: string;
  country?: string;
}

const DestinationPage = () => {
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  const regions = ["All", "HUNZA", "SKARDU", "SWAT", "KALAM", "NARAN", "CHITRAL", "NEELUM_VALLEY"];

  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [destinationsResponse, packagesResponse] = await Promise.all([
          destinationsApi.getAll(),
          packagesApi.getAll(),
        ]);
        const result = destinationsResponse.data;
        const packageResult = packagesResponse.data;
        if (result.success && result.data) {
          const apiDestinations = result.data.items || result.data || [];
          const apiPackages = Array.isArray(packageResult?.data?.items)
            ? packageResult.data.items
            : Array.isArray(packageResult?.data)
            ? packageResult.data
            : [];
          const pricingByDestination = new Map<string, { min: number; count: number }>();
          apiPackages.forEach((pkg: any) => {
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
          const mappedDestinations: Destination[] = apiDestinations.map((d: any) => ({
            id: d.id,
            name: d.name,
            slug: d.slug,
            image: d.image || d.images?.[0] || "/agency-placeholder.jpg",
            rating: d.rating || 4.5,
            startingPrice: pricingByDestination.get(d.id)?.min ?? null,
            packages: pricingByDestination.get(d.id)?.count || d._count?.packages || 0,
            region: d.region || d.country || "",
            description: d.description || "",
            city: d.city,
            country: d.country,
          }));
          setDestinations(mappedDestinations);
          setFilteredDestinations(mappedDestinations);
        } else {
          setError(result.message || "Failed to load destinations");
        }
      } catch (err: any) {
        console.error("Error fetching destinations:", err);
        setError(err.response?.data?.message || err.message || "Failed to load destinations");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDestinations();
  }, []);

  useEffect(() => {
    let filtered = [...destinations];
    if (searchQuery) {
      filtered = filtered.filter((d) => d.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (selectedRegion !== "All") {
      filtered = filtered.filter((d) => d.region === selectedRegion);
    }
    setFilteredDestinations(filtered);
  }, [searchQuery, selectedRegion, destinations]);

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, index) => (
        <FaStar key={index} className={`w-4 h-4 ${index < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const handleCardClick = (dest: Destination) => {
    router.push("/packages?destination=" + dest.slug);
  };

  const handleWishlist = async (e: React.MouseEvent, destId: string) => {
    e.stopPropagation();
    if (!isLoggedIn()) { router.push("/login"); return; }
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(destId) ? next.delete(destId) : next.add(destId);
      return next;
    });
  };

  const getRegionLabel = (region: string) => {
    return region?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
  };

  const DestinationCard = ({ destination }: { destination: Destination }) => (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-3 cursor-pointer h-full"
      onClick={() => handleCardClick(destination)}
    >
      <div className="w-full h-[180px] rounded-lg overflow-hidden relative mb-3">
        <img
          src={destination.image || "/agency-placeholder.jpg"}
          alt={destination.name}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
        />
        <button
          onClick={(e) => handleWishlist(e, destination.id)}
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white"
        >
          <FaHeart className={`w-4 h-4 ${wishlist.has(destination.id) ? "fill-red-500 text-red-500" : "text-gray-600"}`}/>
        </button>
        {destination.region && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-white/90 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
              <FaMapMarkerAlt className="w-3 h-3" /> {getRegionLabel(destination.region)}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900 truncate">{destination.name}</h3>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <FaStar className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-sm font-medium">{destination.rating.toFixed(1)}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{destination.description}</p>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
        <div>
          {destination.startingPrice ? (
            <>
              <p className="text-xs text-gray-500">From</p>
              <p className="text-sm font-bold">Rs {destination.startingPrice.toLocaleString()}</p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Contact for pricing</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Available</p>
          <p className="text-sm font-semibold text-[#008A1E]">{destination.packages} Packages</p>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); router.push("/packages?destination=" + destination.slug); }}
        className="w-full h-[34px] bg-[#008A1E] text-white text-sm font-medium rounded-lg hover:bg-green-700 mt-3"
      >
        View Packages
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading destinations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      <Navbar />
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-[url('/Home.png')] bg-cover bg-no-repeat bg-center">
        <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 mb-20">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[809px] p-6 mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search destinations..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008A1E]" />
              </div>
              <div className="relative">
                <button onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                  className="w-full md:w-48 px-4 py-3 border border-gray-300 rounded-lg flex items-center justify-between bg-white">
                  <span>{selectedRegion === "All" ? "All Regions" : getRegionLabel(selectedRegion)}</span>
                  <FaChevronDown className={`w-4 h-4 transition-transform ${showRegionDropdown ? "rotate-180" : ""}`} />
                </button>
                {showRegionDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {regions.map((region) => (
                      <button key={region} onClick={() => { setSelectedRegion(region); setShowRegionDropdown(false); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm">
                        {region === "All" ? "All Regions" : getRegionLabel(region)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-12">
        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#008A1E] text-white rounded-lg">Try Again</button>
          </div>
        )}
        {!error && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDestinations.map((dest) => (
                <DestinationCard key={dest.id} destination={dest} />
              ))}
            </div>
            {filteredDestinations.length === 0 && (
              <div className="text-center py-12"><p className="text-gray-500">No destinations found.</p></div>
            )}
          </>
        )}
        <section className="bg-[#BCF8FF] rounded-3xl p-8 my-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Are you looking for</h2>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push("/guide")} className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] flex items-center gap-3 text-lg">
              <span>Find a Guide</span><FaArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => router.push("/agency")} className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] flex items-center gap-3 text-lg">
              <span>Browse Agencies</span><FaArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DestinationPage;