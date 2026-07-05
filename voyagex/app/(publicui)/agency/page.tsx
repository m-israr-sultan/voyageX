"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch, FaStar, FaArrowRight, FaMapMarkerAlt, FaCheckCircle,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { agenciesApi } from "@/lib/api";

const UPLOAD_BASE = process.env.NEXT_PUBLIC_UPLOAD_URL ?? "http://localhost:8000";

function resolveUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${UPLOAD_BASE}/${path.replace(/^\//, "")}`;
}

interface Agency {
  id: string; name: string; slug: string; logo: string; location: string;
  city?: string; country?: string; rating: number; isVerified: boolean;
  totalPackages: number; description?: string;
}

interface SearchFilters { agencyName: string; }

const AgencyPage = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>({ agencyName: "" });
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [filteredAgencies, setFilteredAgencies] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgencies = async () => {
      setIsLoading(true);
      try {
        const response = await agenciesApi.getAll({ isVerified: true });
        const result = response.data;
        if (result.success && result.data) {
          const apiAgencies = (result.data.items || result.data || []).filter((a: any) => a.isVerified);
          const mapped: Agency[] = apiAgencies.map((a: any) => ({
            id: a.id,
            name: a.name,
            slug: a.slug,
            logo: a.logo ? resolveUrl(a.logo) : "/agency-placeholder.jpg",
            location: a.city && a.country ? `${a.city}, ${a.country}` : a.city || a.country || "Pakistan",
            city: a.city,
            country: a.country,
            rating: a.rating || 0,
            isVerified: a.isVerified,
            totalPackages: a._count?.packages ?? 0,
            description: a.description,
          }));
          setAgencies(mapped);
          setFilteredAgencies(mapped);
        } else {
          setError(result.message || "Failed to load agencies");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Failed to load agencies.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  // Re-filter whenever name search changes
  useEffect(() => {
    const q = filters.agencyName.trim().toLowerCase();
    if (!q) {
      setFilteredAgencies(agencies);
      return;
    }
    setFilteredAgencies(
      agencies.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.location || "").toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q)
      )
    );
  }, [agencies, filters.agencyName]);

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <FaStar key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const handleCardClick = (agency: Agency) => router.push("/agency/" + agency.slug);
  const handleViewPackages = (agency: Agency, e: React.MouseEvent) => { e.stopPropagation(); router.push("/agency/" + agency.slug + "?tab=packages"); };
  const handleViewDetails = (agency: Agency, e: React.MouseEvent) => { e.stopPropagation(); router.push("/agency/" + agency.slug); };

  const AgencyCard = ({ agency }: { agency: Agency }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-3 cursor-pointer h-full" onClick={() => handleCardClick(agency)}>
      <div className="w-full h-[180px] rounded-lg overflow-hidden relative mb-3">
        <img src={agency.logo} alt={agency.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }} />
        {agency.isVerified && <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">✓ Verified</span>}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-base font-semibold text-gray-900 truncate">{agency.name}</h3>
        {agency.isVerified && <FaCheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
      </div>
      <div className="flex items-center gap-1 text-gray-600 mb-2"><FaMapMarkerAlt className="w-3 h-3" /><span className="text-xs">{agency.location}</span></div>
      <div className="space-y-2 mb-3 flex-1">
        <div className="flex justify-between text-xs"><span className="text-gray-500">Rating</span>{renderStars(agency.rating)}</div>
        <div className="flex justify-between text-xs"><span className="text-gray-500">Packages</span><span className="font-semibold">{agency.totalPackages}</span></div>
      </div>
      <div className="flex gap-2 mt-auto">
        <button onClick={(e) => handleViewPackages(agency, e)} className="flex-1 h-[32px] bg-[#008A1E] text-white text-sm font-medium rounded-lg hover:bg-[#006816]">View Packages</button>
        <button onClick={(e) => handleViewDetails(agency, e)} className="flex-1 h-[32px] bg-[#E6F4EA] text-gray-900 text-sm font-medium rounded-lg hover:bg-[#D6E6DD]">View Details</button>
      </div>
    </div>
  );

  if (isLoading) return (<div className="min-h-screen bg-[#F2F4F7]"><Navbar /><div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mx-auto mb-4"></div><p className="text-gray-600">Loading agencies...</p></div></div>);

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      <Navbar />
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-[url('/Home.png')] bg-cover bg-no-repeat bg-center">
        <div className="absolute bottom-0 left-0 right-0 flex justify-center px-4 mb-20">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[600px] p-4 mx-auto z-10">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-3">
              <FaSearch className="text-gray-500 w-5 h-5" />
              <input type="text" placeholder="Search verified agencies..." value={filters.agencyName}
                onChange={(e) => setFilters((prev) => ({ ...prev, agencyName: e.target.value }))}
                className="flex-1 bg-transparent border-none outline-none text-gray-700 text-lg" />
            </div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-8">
        {error && <div className="text-center py-8"><p className="text-red-500">{error}</p></div>}
        {!error && (
          <section className="py-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Verified Agencies ({filteredAgencies.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAgencies.map((agency) => (<AgencyCard key={agency.id} agency={agency} />))}
            </div>
            {filteredAgencies.length === 0 && !isLoading && (<div className="text-center py-12"><p className="text-gray-500">No verified agencies available yet.</p></div>)}
          </section>
        )}
        <section className="bg-[#BCF8FF] rounded-3xl p-8 my-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Are you looking for</h2>
          <div className="flex gap-4 justify-center">
            <button onClick={() => router.push("/guide")} className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] flex items-center gap-3 text-lg"><span>Guide</span><FaArrowRight className="w-4 h-4" /></button>
            <button onClick={() => router.push("/destination")} className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] flex items-center gap-3 text-lg"><span>Destination</span><FaArrowRight className="w-4 h-4" /></button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AgencyPage;