"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaStar, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaArrowLeft, FaCheck, FaTimes,
  FaSun, FaCloud, FaCloudRain, FaChevronLeft, FaChevronRight, FaMinus, FaPlus,
  FaLock, FaShieldAlt,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer"; 
import { packagesApi, weatherApi, messagesApi } from "@/lib/api";
import { isLoggedIn, getUser } from "@/lib/auth";

const PackageDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [travelers, setTravelers] = useState(2);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [packageData, setPackageData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const slug = params.slug as string;

  useEffect(() => {
    const loadPackage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await packagesApi.getBySlug(slug);
        const result = response.data;
        if (result.success && result.data) setPackageData(result.data);
        else setError(result.message || "Package not found");
      } catch (err: any) { setError(err.response?.data?.message || err.message || "Failed to load package"); }
      finally { setLoading(false); }
    };
    if (slug) loadPackage();
  }, [slug]);

  useEffect(() => {
    if (activeTab === "weather" && packageData && !weatherData && !weatherLoading) {
      const fetchWeather = async () => {
        setWeatherLoading(true);
        const city =
          packageData.destinations?.city ||
          packageData.destinations?.name ||
          packageData.location ||
          "Lahore";
        try {
          const response = await weatherApi.getForecast(city);
          const result = response.data;
          if (result.success && result.data) {
            setWeatherData(result.data);
          } else {
            console.warn("[Weather] API returned no data for city:", city);
            setWeatherData(null);
          }
        } catch (err: any) {
          const status = err?.response?.status;
          const msg = err?.response?.data?.message || err?.message || "unknown";
          console.error(`[Weather] Failed for city "${city}" — status=${status} msg=${msg}`);
          setWeatherData(null);
        } finally {
          setWeatherLoading(false);
        }
      };
      fetchWeather();
    }
  }, [activeTab, packageData, weatherData, weatherLoading]);

  const handleBookNow = () => {
    if (!isLoggedIn()) { router.push("/login"); return; }
    if (getUser()?.role !== "TRAVELER") { setError("Only travelers can book packages"); return; }
    // Route through the unified booking pipeline: travel-detail → billing → confirmation
    router.push(`/booking/travel-detail/${packageData.slug}?type=package`);
  };

  const handleTravelerChange = (type: "increase" | "decrease") => {
    if (type === "increase" && travelers < 20) setTravelers(travelers + 1);
    else if (type === "decrease" && travelers > 1) setTravelers(travelers - 1);
  };

  const renderStars = (rating: number) => (
    <div className="flex">{[...Array(5)].map((_, i) => (<FaStar key={i} className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />))}</div>
  );

  const getWeatherIcon = (condition: string) => {
    const cond = condition?.toLowerCase() || "";
    if (cond.includes("rain") || cond.includes("drizzle")) return <FaCloudRain className="w-8 h-8 mx-auto text-blue-500 mb-2" />;
    if (cond.includes("cloud") || cond.includes("overcast")) return <FaCloud className="w-8 h-8 mx-auto text-gray-500 mb-2" />;
    return <FaSun className="w-8 h-8 mx-auto text-yellow-500 mb-2" />;
  };

  const getAuthorName = () => {
    if (packageData?.guides?.users) return `${packageData.guides.users.firstName} ${packageData.guides.users.lastName}`;
    if (packageData?.agencies?.name) return packageData.agencies.name;
    return "VoyageX";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]"><Navbar /><div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mx-auto mb-4"></div><p className="text-gray-600">Loading package details...</p></div></div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]"><Navbar /><div className="text-center py-20"><h1 className="text-2xl font-bold text-gray-800 mb-4">{error || "Package not found"}</h1><button onClick={() => router.push("/packages")} className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"><FaArrowLeft /> Back to Packages</button></div></div>
    );
  }

  const BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  const resolveUrl = (path: string) => {
    if (!path) return '/agency-placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `${BASE}/${path.replace(/^\//, '')}`;
  };
  const images = (packageData.images || []).map(resolveUrl);
  const displayImage = images[0] || "/agency-placeholder.jpg";
  const totalPrice = (packageData.price || 0) * travelers;

  return (
    <div className="min-h-screen bg-[#F2F4F7] overflow-x-hidden">
      <Navbar />

      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-cover bg-center" style={{ backgroundImage: `url('${displayImage}')` }}>
        <button onClick={() => router.back()} className="absolute top-20 left-4 md:left-8 z-10 text-white bg-black/20 hover:bg-black/30 p-2 rounded-full"><FaArrowLeft className="w-5 h-5 md:w-6 md:h-6" /></button>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white bg-gradient-to-t from-black/70 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2"><FaMapMarkerAlt className="w-4 h-4" /><span>{packageData.destinations?.name || packageData.region || packageData.location || "Pakistan"}</span></div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{packageData.title}</h1>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1"><FaStar className="text-yellow-400" /><span>{packageData.rating || 0} Ratings</span></div>
              <span>{(packageData.price || 0).toLocaleString()} Rs/Person</span>
              <span className="flex items-center gap-1"><FaCalendarAlt className="w-3 h-3" />{packageData.duration} Days</span>
              <span className="flex items-center gap-1"><FaUsers className="w-3 h-3" />{packageData.maxGroupSize || "N/A"} capacity</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6 overflow-x-auto pb-0">
            {["overview", "itinerary", "gallery", "included", "reviews", "weather"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? "border-green-600 text-green-600" : "border-transparent text-gray-600 hover:text-gray-900"}`}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {activeTab === "overview" && (
              <>
                <section><h2 className="text-2xl font-bold mb-4">Tour Overview</h2><p className="text-gray-600 leading-relaxed">{packageData.description || "No description available."}</p></section>
                {packageData.highlights?.length > 0 && (
                  <section><h2 className="text-2xl font-bold mb-4">Tour Highlights</h2><div className="grid sm:grid-cols-2 gap-3">{packageData.highlights.map((item: string, i: number) => (<div key={i} className="flex items-start gap-2"><FaCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" /><span className="text-gray-700">{item}</span></div>))}</div></section>
                )}
                {packageData.requirements?.length > 0 && (
                  <section><h2 className="text-2xl font-bold mb-4">Requirements</h2><div className="grid sm:grid-cols-2 gap-3">{packageData.requirements.map((item: string, i: number) => (<div key={i} className="flex items-start gap-2"><FaTimes className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /><span className="text-gray-700">{item}</span></div>))}</div></section>
                )}
              </>
            )}

            {activeTab === "itinerary" && (
              <section><h2 className="text-2xl font-bold mb-6">Daily Itinerary</h2>
                {packageData.itinerary?.length > 0 ? (
                  <div className="space-y-4">{packageData.itinerary.map((day: any, i: number) => (<div key={i} className="bg-white rounded-xl shadow-md p-6"><div className="flex items-center gap-4 mb-3"><div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">{day.day || i + 1}</div><h3 className="text-lg font-semibold">{day.title || `Day ${day.day || i + 1}`}</h3></div><p className="text-gray-600 ml-16">{day.description || "No details available."}</p></div>))}</div>
                ) : <p className="text-gray-600">No itinerary details available.</p>}
              </section>
            )}

            {activeTab === "gallery" && (
              <section><h2 className="text-2xl font-bold mb-6">Gallery</h2>
                {images.length > 0 ? (
                  <>
                    <div className="relative h-[400px] rounded-xl overflow-hidden mb-4 bg-gray-200">
                      <img src={images[currentImageIndex] || displayImage} alt="Gallery" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }} />
                      {images.length > 1 && (
                        <>
                          <button onClick={() => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center"><FaChevronLeft className="w-5 h-5" /></button>
                          <button onClick={() => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center"><FaChevronRight className="w-5 h-5" /></button>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img: string, i: number) => (
                        <button key={i} onClick={() => setCurrentImageIndex(i)} className={`relative h-20 rounded-lg overflow-hidden ${i === currentImageIndex ? "ring-2 ring-green-600" : ""}`}>
                          <img src={resolveUrl(img)} alt="Thumbnail" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : <p className="text-gray-600">No gallery images available.</p>}
              </section>
            )}

            {activeTab === "included" && (
              <section><h2 className="text-2xl font-bold mb-6">What's Included</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div><h3 className="text-xl font-semibold text-green-600 mb-4">Included</h3>
                    {packageData.includes?.length > 0 ? (<ul className="space-y-3">{packageData.includes.map((item: string, i: number) => (<li key={i} className="flex gap-2"><FaCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" /><span className="text-gray-700">{item}</span></li>))}</ul>) : <p className="text-gray-500">No included items listed.</p>}
                  </div>
                  <div><h3 className="text-xl font-semibold text-red-500 mb-4">Not Included</h3>
                    {packageData.excludes?.length > 0 ? (<ul className="space-y-3">{packageData.excludes.map((item: string, i: number) => (<li key={i} className="flex gap-2"><FaTimes className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" /><span className="text-gray-700">{item}</span></li>))}</ul>) : <p className="text-gray-500">No excluded items listed.</p>}
                  </div>
                </div>
              </section>
            )}

            {activeTab === "reviews" && (
              <section><h2 className="text-2xl font-bold mb-6">Reviews</h2>
                {packageData.reviews?.length > 0 ? (
                  <div className="space-y-4">{packageData.reviews.map((review: any) => (<div key={review.id} className="bg-white rounded-xl shadow-md p-6"><div className="flex items-start gap-4"><div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center"><span className="text-gray-500 font-semibold text-lg">{review.user?.firstName?.[0] || "U"}</span></div><div className="flex-1"><div className="flex justify-between items-center mb-2"><h3 className="font-semibold">{review.user ? `${review.user.firstName} ${review.user.lastName}` : "Anonymous"}</h3><span className="text-sm text-gray-500">{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "N/A"}</span></div><div className="mb-2">{renderStars(review.rating || 0)}</div><p className="text-gray-600">{review.comment || "No comment."}</p></div></div></div>))}</div>
                ) : <p className="text-gray-600">No reviews yet.</p>}
              </section>
            )}

            {activeTab === "weather" && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Weather Forecast</h2>
                {weatherLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#008A1E] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading weather data...</p>
                  </div>
                ) : weatherData?.forecast?.length > 0 ? (
                  <>
                    {weatherData.city && (
                      <p className="text-gray-500 mb-4 text-sm">
                        Weather for{" "}
                        <span className="font-medium">
                          {weatherData.city}{weatherData.country ? `, ${weatherData.country}` : ""}
                        </span>
                      </p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {weatherData.forecast.slice(0, 4).map((day: any, i: number) => (
                        <div key={i} className="bg-white rounded-lg shadow p-3 text-center">
                          <p className="font-medium mb-2 text-sm text-gray-600">
                            {day.date
                              ? new Date(day.date).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })
                              : `Day ${i + 1}`}
                          </p>
                          {getWeatherIcon(day.description || "")}
                          <p className="text-lg font-semibold">
                            {day.temp !== undefined ? `${Math.round(day.temp)}°C` : "—"}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{day.description || "N/A"}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : weatherData?.error ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <FaCloud className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">Weather data temporarily unavailable</p>
                    <p className="text-gray-500 text-sm mt-1">
                      The weather service could not be reached. Please try again later.
                    </p>
                  </div>
                ) : weatherData !== null ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                    <FaMapMarkerAlt className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                    <p className="text-amber-800 font-medium">No forecast data for this location</p>
                    <p className="text-amber-600 text-sm mt-1">
                      The package location is not recognised by the weather service.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                    <FaCloud className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-700 font-medium">Weather unavailable</p>
                    <p className="text-gray-500 text-sm mt-1">
                      Could not load weather data. Please try again later.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="mb-4"><span className="text-3xl font-bold">{(packageData.price || 0).toLocaleString()} Rs</span><span className="text-gray-500 ml-2">/ person</span></div>
              <div className="border-y border-gray-200 py-4 mb-4"><div className="flex justify-between"><span className="text-gray-600">Duration</span><span className="font-medium">{packageData.duration} Days</span></div></div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Travelers</label>
                <div className="flex items-center justify-between border border-gray-300 rounded-lg p-2">
                  <button onClick={() => handleTravelerChange("decrease")} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"><FaMinus className="w-3 h-3" /></button>
                  <span className="font-medium">{travelers} {travelers === 1 ? "Person" : "People"}</span>
                  <button onClick={() => handleTravelerChange("increase")} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"><FaPlus className="w-3 h-3" /></button>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm"><span className="text-gray-600">{(packageData.price || 0).toLocaleString()} Rs × {travelers}</span><span className="font-medium">{totalPrice.toLocaleString()} Rs</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="text-green-600">{totalPrice.toLocaleString()} Rs</span></div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-start gap-2"><FaShieldAlt className="w-4 h-4 text-blue-600 mt-0.5" /><p className="text-xs text-blue-800"><strong>Secure Booking:</strong> Payment held by VoyageX until trip completion. Full refund if cancelled 48h before start.</p></div>
              <button onClick={handleBookNow} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"><FaLock className="w-4 h-4" /> Book Now - Pay Advance</button>
              <p className="text-xs text-gray-500 text-center mt-3">By booking, you agree to our <Link href="/" className="text-[#008A1E] hover:underline">Terms</Link></p>
            </div>

            {(packageData.agencies || packageData.guides) && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-3">{packageData.agencies ? "About Agency" : "About Guide"}</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {packageData.agencies?.logo ? <img src={resolveUrl(packageData.agencies.logo)} alt="" className="w-12 h-12 object-cover" /> : <span className="text-gray-500 font-semibold">{(packageData.agencies?.name?.[0] || packageData.guides?.users?.firstName?.[0] || "V")}</span>}
                  </div>
                  <div><h4 className="font-semibold">{packageData.agencies?.name || getAuthorName()}</h4><div className="flex items-center gap-1">{renderStars(packageData.agencies?.rating || packageData.guides?.rating || 4.5)}</div></div>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{packageData.agencies?.description || packageData.guides?.bio || "No description available."}</p>
                <div className="flex gap-3">
                  <button onClick={() => router.push(packageData.agencies ? `/agency/${packageData.agencies.slug}` : `/guide/${packageData.guides?.slug}`)} className="flex-1 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700">View Details</button>
                  <button onClick={async () => {
                    const recipientId = packageData.agencies?.userId || packageData.guides?.userId;
                    if (!recipientId) return;
                    try {
                      const resp = await messagesApi.createConversation({ recipientId });
                      const result = resp.data;
                      if (result.success && result.data?.id) {
                        router.push(`/message/${result.data.id}`);
                      }
                    } catch { router.push("/message"); }
                  }} className="flex-1 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200">Message</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PackageDetailPage;