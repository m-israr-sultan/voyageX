"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  FaStar, FaMapMarkerAlt, FaArrowLeft, FaEnvelope,
  FaGlobe, FaUsers, FaBriefcase, FaImage, FaCheckCircle,
  FaPhone,
} from "react-icons/fa";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { agenciesApi, messagesApi } from "@/lib/api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function resolveUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_UPLOAD_URL ?? "http://localhost:8000";
  return `${base}/${path.replace(/^\//, "")}`;
}

function getRegionLabel(value: string): string {
  const map: Record<string, string> = {
    HUNZA: "Hunza Valley", SKARDU: "Skardu", GILGIT: "Gilgit",
    NAGAR: "Nagar", GHIZER: "Ghizer", SWAT: "Swat", KALAM: "Kalam",
    CHITRAL: "Chitral", NARAN: "Naran", KAGHAN: "Kaghan", MURREE: "Murree",
    ABBOTTABAD: "Abbottabad", NEELUM_VALLEY: "Neelum Valley",
    MUZAFFARABAD: "Muzaffarabad", RAWALAKOT: "Rawalakot",
  };
  return map[value] ?? value?.replace(/_/g, " ") ?? "—";
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "about" | "packages" | "gallery" | "reviews";

// ─── Component ────────────────────────────────────────────────────────────────

const AgencyDetailPage = () => {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [agency, setAgency]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("about");
  const [msgLoading, setMsgLoading] = useState(false);

  const slug = params.slug as string;

  // Allow deep-linking to a tab via ?tab=packages
  useEffect(() => {
    const tab = searchParams.get("tab") as Tab | null;
    if (tab && ["about", "packages", "gallery", "reviews"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!slug) return;
    const fetchAgency = async () => {
      setLoading(true);
      try {
        const response = await agenciesApi.getBySlug(slug);
        const result   = response.data;
        if (result.success && result.data) {
          setAgency(result.data);
        } else {
          setAgency(null);
        }
      } catch (err: any) {
        console.error("Error fetching agency:", err);
        setAgency(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAgency();
  }, [slug]);

  // ─── stars ──────────────────────────────────────────────────────────────────

  const renderStars = (rating: number = 0) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  // ─── messaging ──────────────────────────────────────────────────────────────

  const handleMessageAgency = async () => {
    if (!agency) return;
    setMsgLoading(true);
    try {
      // Use agency.userId (the FK to users table) — this is the correct recipient
      const recipientId = agency.userId ?? agency.users?.id;
      if (!recipientId) { alert("Cannot message this agency right now."); return; }
      const response = await messagesApi.createConversation({ recipientId });
      const result   = response.data;
      if (result.success && result.data) {
        router.push(`/message/${result.data.id}`);
      }
    } catch (err: any) {
      console.error("Failed to create conversation:", err);
    } finally {
      setMsgLoading(false);
    }
  };

  // ─── loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <div className="text-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mx-auto mb-4" />
        <p className="text-gray-600">Loading agency details…</p>
      </div>
    </div>
  );

  if (!agency) return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Agency not found</h1>
        <button onClick={() => router.push("/agency")}
          className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium">
          <FaArrowLeft /> Back to Agencies
        </button>
      </div>
    </div>
  );

  // ─── derived data ────────────────────────────────────────────────────────────

  const agencyLogo    = agency.logo        ? resolveUrl(agency.logo)        : "/agency-placeholder.jpg";
  const coverImage    = agency.coverImage  ? resolveUrl(agency.coverImage)  : agencyLogo;
  const packagesList  = agency.packages    ?? [];
  const reviewsList   = agency.reviews     ?? [];
  const galleryImages = (agency.galleryImages ?? []).map(resolveUrl).filter(Boolean);

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />

      {/* ── Hero / Cover ── */}
      <div className="relative h-[280px] sm:h-[380px] md:h-[480px]">
        <div className="absolute inset-0">
          <img
            src={coverImage}
            alt={agency.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-20 left-4 md:left-8 z-10 text-white bg-black/30 hover:bg-black/50 p-2.5 rounded-full transition-colors"
        >
          <FaArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Agency identity in hero */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Logo circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg flex-shrink-0">
                <img
                  src={agencyLogo}
                  alt={agency.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                />
              </div>
              <div className="text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-md">{agency.name}</h1>
                  {agency.isVerified && (
                    <span className="flex items-center gap-1 bg-green-500 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                      <FaCheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-1 text-sm text-white/90">
                  {(agency.city || agency.country) && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="w-3.5 h-3.5" />
                      {[agency.city, agency.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {agency.region && (
                    <span className="flex items-center gap-1">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 opacity-70" />
                      {getRegionLabel(agency.region)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    {renderStars(agency.rating ?? 0)}
                    <span className="text-white/80 text-xs">({agency.totalReviews ?? reviewsList.length} reviews)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6 sm:mb-8">
          <button
            onClick={handleMessageAgency}
            disabled={msgLoading}
            className="px-5 py-2.5 bg-[#008A1E] text-white font-medium rounded-lg hover:bg-[#006816] transition-colors flex items-center gap-2 text-sm disabled:opacity-60"
          >
            <FaEnvelope className="w-4 h-4" />
            {msgLoading ? "Opening chat…" : "Message Agency"}
          </button>
          {/* Website link removed — all inquiries go through VoyageX messaging */}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {(["about", "packages", "gallery", "reviews"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 text-sm font-medium transition-colors border-b-2 capitalize ${
                  activeTab === tab
                    ? "text-[#008A1E] border-[#008A1E]"
                    : "text-gray-500 border-transparent hover:text-gray-800"
                }`}
              >
                {tab === "about"    ? "About" :
                 tab === "packages" ? `Packages (${packagesList.length})` :
                 tab === "gallery"  ? `Gallery (${galleryImages.length})` :
                                     `Reviews (${reviewsList.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* ── About Tab ── */}
        {activeTab === "about" && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">About {agency.name}</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                {agency.description || "No description available."}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-t border-b border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#008A1E]">{packagesList.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Tour Packages</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#008A1E]">{agency.totalReviews ?? reviewsList.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#008A1E]">{(agency.rating ?? 0).toFixed(1)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Avg Rating</p>
              </div>
            </div>

            {/* Detail fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {agency.address && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Address</p>
                  <p className="text-sm text-gray-800 font-medium">{agency.address}</p>
                </div>
              )}
              {agency.city && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">City</p>
                  <p className="text-sm text-gray-800 font-medium flex items-center gap-1">
                    <FaMapMarkerAlt className="w-3 h-3 text-[#008A1E]" /> {agency.city}
                  </p>
                </div>
              )}
              {agency.country && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Country</p>
                  <p className="text-sm text-gray-800 font-medium">{agency.country}</p>
                </div>
              )}
              {agency.region && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Region</p>
                  <p className="text-sm text-gray-800 font-medium flex items-center gap-1">
                    <FaMapMarkerAlt className="w-3 h-3 text-[#008A1E]" />
                    {getRegionLabel(agency.region)}
                  </p>
                </div>
              )}
              {/* Website and email removed from public profile — contact via Message Agency button */}
            </div>
          </div>
        )}

        {/* ── Packages Tab ── */}
        {activeTab === "packages" && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Packages</h2>
            {packagesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {packagesList.map((pkg: any) => {
                  const pkgImg = pkg.images?.[0] ? resolveUrl(pkg.images[0]) : "/agency-placeholder.jpg";
                  return (
                    <div
                      key={pkg.id}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => router.push(`/packages/${pkg.slug}`)}
                    >
                      <div className="relative h-40 sm:h-48 bg-gray-100">
                        <img
                          src={pkgImg}
                          alt={pkg.title ?? pkg.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                        />
                        <div className="absolute top-2 right-2 bg-[#008A1E] text-white text-xs px-2 py-1 rounded-full font-medium">
                          {pkg.duration ?? "?"} Days
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-1">
                          {pkg.title ?? pkg.name}
                        </h3>
                        <p className="text-gray-500 text-xs mb-3 line-clamp-2">
                          {pkg.description?.substring(0, 100) ?? "No description."}
                        </p>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[#008A1E] font-bold text-sm">
                            PKR {(pkg.price ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/packages/${pkg.slug}`); }}
                          className="w-full py-2 bg-[#008A1E] text-white text-sm rounded-lg hover:bg-[#006816] transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaBriefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No packages available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Gallery Tab ── */}
        {activeTab === "gallery" && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Agency Gallery
              <span className="text-sm font-normal text-gray-400 ml-2">({galleryImages.length} photos)</span>
            </h2>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {galleryImages.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:scale-[1.03] transition-transform shadow-sm"
                    onClick={() => window.open(img, "_blank")}
                  >
                    <img
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/agency-placeholder.jpg"; }}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 hover:opacity-100 text-white text-xs font-medium transition-opacity">View</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaImage className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No gallery images available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Reviews Tab ── */}
        {activeTab === "reviews" && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Client Reviews
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({agency.totalReviews ?? reviewsList.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {renderStars(agency.rating ?? 0)}
                <span className="text-sm font-semibold text-gray-700">{(agency.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
            {reviewsList.length > 0 ? (
              <div className="space-y-5">
                {reviewsList.map((review: any) => (
                  <div key={review.id} className="flex gap-3 pb-5 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {review.users?.avatar ? (
                        <img
                          src={resolveUrl(review.users.avatar)}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <span className="text-gray-500 font-semibold text-sm">
                          {review.users?.firstName?.[0] ?? "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {review.users ? `${review.users.firstName} ${review.users.lastName}` : "Anonymous"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" }) : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(review.rating ?? 0)}
                        <span className="text-xs text-gray-500 ml-1">{review.rating ?? 0}/5</span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaStar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No reviews yet. Be the first to review this agency!</p>
              </div>
            )}
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
};

export default AgencyDetailPage;