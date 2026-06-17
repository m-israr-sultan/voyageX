"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaStar, FaMapMarkerAlt, FaArrowLeft, FaEnvelope,
  FaCertificate, FaLanguage, FaBriefcase, FaCheckCircle, FaClock,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { guidesApi, messagesApi } from "@/lib/api";

const GuideProfilePage = () => {
  const params = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const slug = params.slug as string;

  useEffect(() => {
    const fetchGuide = async () => {
      setLoading(true);
      try {
        const response = await guidesApi.getBySlug(slug);
        const result = response.data;
        if (result.success && result.data) setGuide(result.data);
      } catch (err: any) { console.error("Error fetching guide:", err); }
      finally { setLoading(false); }
    };
    if (slug) fetchGuide();
  }, [slug]);

  const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const resolveUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${BASE}/${path.replace(/^\//, '')}`;
  };

  const getGuideName = () => guide?.users?.firstName && guide?.users?.lastName ? `${guide.users.firstName} ${guide.users.lastName}` : guide?.name || "Unknown Guide";
  const getGuideImage = () => {
    const raw = guide?.users?.avatar || guide?.image || '';
    return raw ? resolveUrl(raw) : '/guid-placeholder.jpg';
  };
  const isAvailable = guide?.isAvailable !== false;

  const renderStars = (rating: number) => (
    <div className="flex">{[...Array(5)].map((_, i) => (<FaStar key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />))}</div>
  );

  const handleBookNow = () => { if (!guide || !isAvailable) return; router.push("/booking/travel-detail/" + guide.slug + "?type=guide"); };

  const handleMessageClick = async () => {
    if (!guide) return;
    try {
      const response = await messagesApi.createConversation({ recipientId: guide.userId || guide.id });
      const result = response.data;
      if (result.success && result.data) router.push("/message/" + result.data.id);
    } catch (err: any) { console.error("Failed to create conversation:", err); }
  };

  if (loading) return (<div className="min-h-screen bg-[#F2F4F7]"><Navbar /><div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mx-auto mb-4"></div><p className="text-gray-600">Loading guide profile...</p></div></div>);
  if (!guide) return (<div className="min-h-screen bg-[#F2F4F7]"><Navbar /><div className="text-center py-20"><h1 className="text-2xl font-bold text-gray-800 mb-4">Guide not found</h1><button onClick={() => router.push("/guide")} className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"><FaArrowLeft /> Back to Guides</button></div></div>);

  const guideName = getGuideName();

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button onClick={() => router.push("/guide")} className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium mb-6 text-sm sm:text-base"><FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> Back to Guides</button>
        
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#008A1E] mx-auto md:mx-0 flex-shrink-0">
              <img src={getGuideImage()} alt={guideName} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/guid-placeholder.jpg"; }} />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">{guideName}</h1>
                    {guide.isVerified && <FaCheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />}
                    {!isAvailable && <span className="flex items-center gap-1 text-xs sm:text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full"><FaClock className="w-3 h-3" /> Unavailable</span>}
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4">
                    <div className="flex items-center gap-2">{renderStars(guide.rating || 0)}<span className="text-gray-700 font-medium text-sm sm:text-base">{(guide.rating || 0).toFixed(1)}</span></div>
                    <div className="flex items-center gap-1 text-gray-600 text-sm sm:text-base"><FaMapMarkerAlt className="text-[#008A1E] w-3 h-3 sm:w-4 sm:h-4" /><span>{guide.location || "Pakistan"}</span></div>
                  </div>
                </div>
                <div className="bg-[#E6F4EA] px-4 sm:px-6 py-2 sm:py-3 rounded-xl">
                  <p className="text-xs sm:text-sm text-gray-600">Price per day</p>
                  <p className="text-xl sm:text-2xl font-bold text-[#008A1E]">{guide.pricePerDay > 0 ? `${guide.pricePerDay.toLocaleString()} PKR` : "Contact for price"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-md mx-auto md:mx-0">
                <div className="text-center"><p className="text-xl sm:text-2xl font-bold text-gray-900">{guide.completedTours || 0}+</p><p className="text-xs text-gray-600">Tours</p></div>
                <div className="text-center"><p className="text-xl sm:text-2xl font-bold text-gray-900">{guide.happyClients || 0}+</p><p className="text-xs text-gray-600">Clients</p></div>
                <div className="text-center"><p className="text-xl sm:text-2xl font-bold text-gray-900">{guide.experience || "N/A"}</p><p className="text-xs text-gray-600">Experience</p></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {isAvailable ? (
                  <button onClick={handleBookNow} className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-[#008A1E] text-white font-semibold rounded-lg hover:bg-[#006816] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"><FaBriefcase className="w-4 h-4" /> Book Now</button>
                ) : (
                  <div className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-500 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed text-sm sm:text-base"><FaClock className="w-4 h-4" /> Currently Unavailable</div>
                )}
                <button onClick={handleMessageClick} className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-[#E6F4EA] text-gray-900 font-semibold rounded-lg hover:bg-[#D6E6DD] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"><FaEnvelope className="w-4 h-4" /> Send Message</button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex border-b overflow-x-auto">
                {["about", "reviews", "gallery"].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab ? "text-[#008A1E] border-b-2 border-[#008A1E] bg-[#E6F4EA]" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
                    {tab === "about" ? "About" : tab === "reviews" ? `Reviews (${guide.reviews?.length || 0})` : "Gallery"}
                  </button>
                ))}
              </div>
              <div className="p-4 sm:p-6">
                {activeTab === "about" && (
                  <div className="space-y-6">
                    <div><h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Bio</h3><p className="text-sm sm:text-base text-gray-700 leading-relaxed">{guide.bio || "No bio available."}</p></div>
                    {guide.certifications?.length > 0 && (<div><h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Certifications</h3><div className="flex flex-wrap gap-2">{guide.certifications.map((cert: string, i: number) => (<div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"><FaCertificate className="w-4 h-4 text-[#008A1E]" /><span className="text-xs sm:text-sm text-gray-700">{cert}</span></div>))}</div></div>)}
                    {guide.languages?.length > 0 && (<div><h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Languages</h3><div className="flex flex-wrap gap-2">{guide.languages.map((lang: string, i: number) => (<div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"><FaLanguage className="w-4 h-4 text-[#008A1E]" /><span className="text-xs sm:text-sm text-gray-700">{lang}</span></div>))}</div></div>)}
                    {guide.specialities?.length > 0 && (<div><h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Specialties</h3><div className="flex flex-wrap gap-2">{guide.specialities.map((spec: string, i: number) => (<span key={i} className="px-3 py-1 bg-[#008A1E] text-white text-xs sm:text-sm rounded-full">{spec}</span>))}</div></div>)}
                  </div>
                )}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {guide.reviews?.length > 0 ? guide.reviews.map((review: any) => (
                      <div key={review.id} className="border-b border-gray-100 pb-4">
                        <div className="flex items-start gap-3">
                          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                            {review.users?.avatar ? <img src={resolveUrl(review.users.avatar)} alt="" className="w-full h-full object-cover rounded-full" /> : <span className="text-gray-500 font-semibold text-sm sm:text-base">{review.users?.firstName?.[0] || "U"}</span>}
                          </div>
                          <div className="flex-1"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0"><h4 className="font-semibold text-gray-900 text-sm sm:text-base">{review.users ? `${review.users.firstName} ${review.users.lastName}` : "Anonymous"}</h4><span className="text-xs text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}</span></div><div className="flex items-center gap-1 mt-1">{renderStars(review.rating)}</div><p className="text-gray-700 text-xs sm:text-sm mt-2">{review.comment}</p></div>
                        </div>
                      </div>
                    )) : (<p className="text-gray-600 text-center py-4 text-sm sm:text-base">No reviews yet</p>)}
                  </div>
                )}
                {activeTab === "gallery" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    {guide.destinationImages?.length > 0 ? guide.destinationImages.map((img: string, i: number) => (<div key={i} className="relative aspect-video rounded-lg overflow-hidden"><img src={resolveUrl(img)} alt="Gallery" className="w-full h-full object-cover" /></div>)) : (<p className="text-gray-600 col-span-full text-center py-4 text-sm sm:text-base">No gallery images available</p>)}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Region</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base text-right">{guide.region ? guide.region.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Experience</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{guide.experience ? `${guide.experience} years` : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Status</span>
                  <span className={`font-medium text-sm sm:text-base ${isAvailable ? "text-green-600" : "text-orange-600"}`}>{isAvailable ? "Available" : "Unavailable"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm sm:text-base">Price Per Day</span>
                  <span className="font-bold text-[#008A1E] text-sm sm:text-base">{guide.pricePerDay > 0 ? `${guide.pricePerDay.toLocaleString()} PKR` : "Contact for price"}</span>
                </div>
              </div>
              <button onClick={handleMessageClick} className="w-full mt-4 sm:mt-6 px-4 py-2 sm:py-3 bg-[#E6F4EA] text-gray-900 font-medium rounded-lg hover:bg-[#D6E6DD] transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"><FaEnvelope className="w-4 h-4" /> Message {guideName.split(" ")[0]}</button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GuideProfilePage;