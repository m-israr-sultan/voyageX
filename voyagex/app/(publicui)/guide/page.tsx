"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch, FaStar, FaArrowRight, FaMapMarkerAlt, FaEnvelope, FaUser, FaCheckCircle,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { guidesApi, messagesApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

interface Guide {
  id: string; slug: string; userId?: string;
  users?: { id?: string; firstName: string; lastName: string; avatar?: string };
  location: string; rating: number; pricePerDay: number;
  specialities: string[]; languages: string[]; region: string;
  experience: string; isVerified: boolean; isAvailable: boolean; bio?: string;
}

const GuidePage = () => {
  const router = useRouter();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [filteredGuides, setFilteredGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchGuides = async () => {
      setIsLoading(true);
      try {
        const response = await guidesApi.getAll({ isVerified: true });
        const result = response.data;
        if (result.success && result.data) {
          const apiGuides = result.data.items || result.data || [];
          const mappedGuides: Guide[] = apiGuides
            .filter((g: any) => g.isVerified && g.isAvailable !== false)
            .map((g: any) => ({
              id: g.id, slug: g.slug,
              users: g.users || g.user,
              location: g.location || "", rating: g.rating || 0,
              pricePerDay: g.pricePerDay || 0, specialities: g.specialities || [],
              languages: g.languages || [], region: g.region || "",
              experience: g.experience || "", isVerified: g.isVerified || false,
              isAvailable: g.isAvailable !== false, bio: g.bio,
            }));
          setGuides(mappedGuides);
          setFilteredGuides(mappedGuides);
        } else { setError(result.message || "Failed to load guides"); }
      } catch (err: any) { setError(err.response?.data?.message || err.message || "Failed to load guides."); }
      finally { setIsLoading(false); }
    };
    fetchGuides();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!search.trim()) { setFilteredGuides(guides); return; }
      const q = search.toLowerCase();
      setFilteredGuides(guides.filter((g) => {
        const name = `${g.users?.firstName || ""} ${g.users?.lastName || ""}`.toLowerCase();
        return name.includes(q) || g.location?.toLowerCase().includes(q);
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search, guides]);

  const getGuideName = (guide: Guide) => guide.users?.firstName && guide.users?.lastName ? `${guide.users.firstName} ${guide.users.lastName}` : "Unknown Guide";
  const getGuideImage = (guide: Guide) => {
    const raw = guide.users?.avatar || '';
    return raw ? getImageUrl(raw) : '/guid-placeholder.jpg';
  };
  
  const getDisplaySpecialities = (specialities: string[]) => {
    if (!specialities || specialities.length === 0) return ["General"];
    if (specialities.length <= 2) return specialities;
    return [specialities[0], specialities[1], "..."];
  };

  const renderStars = (rating: number) => (
    <div className="flex">{[...Array(5)].map((_, i) => (<FaStar key={i} className={`w-3 h-3 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />))}</div>
  );

  const formatPrice = (price: number) => price > 0 ? `${price.toLocaleString()} PKR` : "Contact for price";

  if (isLoading) return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      <Navbar />
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-[url('/Home.png')] bg-cover bg-no-repeat bg-center">
        <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 mb-20">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[600px] p-4 mx-auto z-10">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-3">
              <FaSearch className="text-gray-500 w-5 h-5" />
              <input type="text" placeholder="Search verified guides by name or location..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-gray-700 text-lg" />
            </div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && <div className="text-center py-8"><p className="text-red-500">{error}</p></div>}
        {!error && (
          <section className="py-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4 sm:mb-6">Verified Guides ({filteredGuides.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredGuides.map((guide) => (
                <div key={guide.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-3 sm:p-4 cursor-pointer h-full" onClick={() => router.push("/guide/" + guide.slug)}>
                  <div className="w-full h-[160px] sm:h-[180px] md:h-[200px] rounded-lg overflow-hidden relative mb-3">
                    <img src={getGuideImage(guide)} alt={getGuideName(guide)} loading="lazy" decoding="async" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }} />
                    {guide.isVerified && <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">✓ Verified</span>}
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{getGuideName(guide)}</h3>
                    {guide.isVerified && <FaCheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 mb-2"><FaMapMarkerAlt className="w-3 h-3 flex-shrink-0" /><span className="text-xs sm:text-sm truncate">{guide.location || "Pakistan"}</span></div>
                  <div className="space-y-2 mb-3 flex-1">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-500">Rating</span>
                      <div className="flex items-center gap-1">{renderStars(guide.rating)}</div>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-500">Price/Day</span>
                      <span className="font-semibold text-xs sm:text-sm">{formatPrice(guide.pricePerDay)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-gray-500">Specialties</span>
                      <span className="font-semibold text-right text-xs sm:text-sm">
                        {getDisplaySpecialities(guide.specialities).join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={(e) => { e.stopPropagation(); router.push("/guide/" + guide.slug); }} className="flex-1 h-[32px] sm:h-[36px] bg-[#008A1E] text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-[#006816] transition-colors">View Profile</button>
                    <button onClick={async (e) => {
                      e.stopPropagation();
                      const recipientId = guide.userId || guide.users?.id;
                      if (!recipientId) return;
                      try {
                        const resp = await messagesApi.createConversation({ recipientId });
                        const result = resp.data;
                        if (result.success && result.data?.id) {
                          router.push(`/message/${result.data.id}`);
                        }
                      } catch { router.push("/message"); }
                    }} className="flex-1 h-[32px] sm:h-[36px] bg-[#E6F4EA] text-gray-900 text-xs sm:text-sm font-medium rounded-lg hover:bg-[#D6E6DD] transition-colors">Message</button>
                  </div>
                </div>
              ))}
            </div>
            {filteredGuides.length === 0 && !isLoading && (
              <div className="text-center py-12"><p className="text-gray-500">No verified guides available yet.</p></div>
            )}
          </section>
        )}
        <section className="bg-[#BCF8FF] rounded-2xl sm:rounded-3xl p-6 sm:p-8 my-6 sm:my-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Are you looking for</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={()   => router.push("/agency")} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#008A1E] text-white rounded-xl sm:rounded-2xl hover:bg-[#006816] transition-colors flex items-center justify-center gap-3 text-base sm:text-lg"><span>Agency</span><FaArrowRight className="w-4 h-4" /></button>
            <button onClick={() => router.push("/destination")} className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#008A1E] text-white rounded-xl sm:rounded-2xl hover:bg-[#006816] transition-colors flex items-center justify-center gap-3 text-base sm:text-lg"><span>Destination</span><FaArrowRight className="w-4 h-4" /></button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default GuidePage;