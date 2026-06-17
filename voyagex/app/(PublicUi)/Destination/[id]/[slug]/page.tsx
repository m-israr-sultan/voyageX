"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FaStar,
  FaMapMarkerAlt,
  FaCalendar,
  FaUsers,
  FaArrowLeft,
  FaCheck,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { destinationsApi, packagesApi } from "@/lib/api";

const DestinationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [destination, setDestination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const destinationId = params.id as string;
  const slug = params.slug as string;

  useEffect(() => {
    const fetchDestination = async () => {
      setLoading(true);
      try {
        const response = await destinationsApi.getBySlug(slug);
        const result = response.data;
        if (result.success && result.data) {
          setDestination(result.data);
        }
      } catch (err: any) {
        console.error("Error fetching destination:", err);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchDestination();
  }, [slug]);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!destination) return;
      setPackagesLoading(true);
      try {
        const response = await packagesApi.getAll({
          destinationSlug: destination.slug,
          limit: 10,
        });
        const result = response.data;
        if (result.success && result.data) {
          const pkgList = result.data.items || result.data || [];
          setPackages(pkgList);
        }
      } catch (err: any) {
        console.error("Error fetching packages:", err);
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, [destination]);

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <FaStar key={i} className={`w-5 h-5 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const formatPrice = (price: number | null) =>
    typeof price === "number" ? `Rs: ${price.toLocaleString()}` : "Price unavailable";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mb-4"></div>
            <p className="text-gray-600">Loading destination details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Destination not found</h1>
            <button onClick={() => router.push("/destination")} className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium">
              <FaArrowLeft /> Back to Destinations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayImage = destination.image || destination.images?.[0] || "/agency-placeholder.jpg";
  const minPackagePrice = packages.length > 0 ? Math.min(...packages.map((pkg) => Number(pkg.price || 0))) : null;

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => router.push("/destination")} className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium mb-6">
          <FaArrowLeft /> Back to Destinations
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              {destination.isPopular && (
                <span className="bg-[#008A1E] text-white px-3 py-1 rounded-full text-sm font-semibold mb-4 inline-block">Popular Destination</span>
              )}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{destination.name}</h1>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(destination.rating || 0)}
                  <span className="text-gray-700">{(destination.rating || 0).toFixed(1)} Rating</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt className="text-[#008A1E]" />
                  <span>{destination.city || destination.country || destination.region || "Pakistan"}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-[#008A1E]">{formatPrice(minPackagePrice)}</div>
                <div className="text-lg text-gray-700"><span className="font-semibold">{packages.length}</span> packages available</div>
              </div>
              <p className="text-gray-700 text-lg mb-6">{destination.description || "No description available."}</p>
            </div>
            <div className="lg:w-80">
              <div className="bg-[#E6F4EA] rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Destination Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Time to Visit:</span>
                    <span className="font-medium text-gray-800">{destination.bestTimeToVisit || "April to October"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty Level:</span>
                    <span className="font-medium text-gray-800">{destination.difficulty || "Easy to Moderate"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Packages:</span>
                    <span className="font-medium text-gray-800">{packages.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <img
                src={displayImage}
                alt={destination.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
              />
            </div>
            {destination.highlights && destination.highlights.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Destination Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {destination.highlights.map((highlight: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <FaCheck className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Packages</h2>
              {packagesLoading ? (
                <div className="text-center py-4"><div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#008A1E]"></div></div>
              ) : (
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900 mb-2">{pkg.title}</h3>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[#008A1E] font-bold">{(pkg.price || 0).toLocaleString()} Rs</span>
                        <span className="text-sm text-gray-500">{pkg.duration} Days</span>
                      </div>
                      <button onClick={() => router.push("/packages/" + pkg.slug)}
                        className="w-full py-2 bg-[#008A1E] text-white text-sm font-medium rounded-lg hover:bg-[#006816]">View Package</button>
                    </div>
                  ))}
                  {packages.length === 0 && <p className="text-gray-500 text-center py-4">No packages available.</p>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore</h2>
              <div className="space-y-3 mb-6">
                <button onClick={() => router.push("/guide")}
                  className="w-full py-3 bg-[#008A1E] text-white font-medium rounded-lg hover:bg-[#006816] flex items-center justify-center gap-2">
                  👨‍💼 Find a Local Guide
                </button>
                <button onClick={() => router.push("/agency")}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                  🏢 Browse Agencies
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DestinationDetailPage;