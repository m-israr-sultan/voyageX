"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FaStar,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaCertificate,
  FaLanguage,
  FaBriefcase,
  FaCheck,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaUser,
} from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import Navbar from "@/Components/navbar";

interface GuideDetail {
  id: number;
  name: string;
  image: string;
  location: string;
  rating: number;
  pricePerDay: number;
  specialty: string;
  region: string;
  experience: string;
  languages: string[];
  bio: string;
  certifications: string[];
  completedTours: number;
  happyClients: number;
  responseTime: string;
  phone?: string;
  email?: string;
  website?: string;
  whatsapp?: string;
  gallery?: string[];
  reviews?: {
    id: number;
    userName: string;
    userImage: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export default function GuideProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    const fetchGuideProfile = async () => {
      setLoading(true);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get the slug from params
      const guideSlug = params.slug as string;

      // Mock guides data - matching your listing page data
      const mockGuides: GuideDetail[] = [
        {
          id: 1,
          name: "Muhammad Afnan",
          image: "/guid 1.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          region: "Gilgit Baltistan",
          experience: "5+ years",
          languages: ["Urdu", "English", "Shina"],
          bio: "I am a professional tour guide from Hunza Valley with over 5 years of experience. I specialize in trekking and hiking expeditions in the breathtaking mountains of Gilgit-Baltistan. I have guided over 500 tourists from around the world and love sharing the rich culture and natural beauty of my homeland.",
          certifications: [
            "Wilderness First Responder",
            "Mountain Guide License - GB Tourism Department",
            "CPR & First Aid Certified",
            "Cultural Heritage Ambassador"
          ],
          completedTours: 450,
          happyClients: 520,
          responseTime: "Within 1 hour",
          phone: "+92 3XX XXXXXXX",
          email: "afnan.guide@voyagex.com",
          whatsapp: "+92 3XX XXXXXXX",
          gallery: ["/hunza.jpg", "/skardu.jpg", "/swat.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Ali Raza",
              userImage: "/user1.jpg",
              rating: 5,
              comment: "Afnan was an amazing guide! Very knowledgeable about the area and extremely helpful throughout our trek.",
              date: "2 weeks ago"
            },
            {
              id: 2,
              userName: "Sarah Khan",
              userImage: "/user2.jpg",
              rating: 5,
              comment: "Best guide in Hunza! He took us to hidden spots that weren't in any guidebook. Highly recommended!",
              date: "1 month ago"
            }
          ]
        },
        {
          id: 2,
          name: "Zakir Ullah",
          image: "/guid 2.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 4,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          region: "Gilgit Baltistan",
          experience: "3+ years",
          languages: ["Urdu", "English"],
          bio: "Passionate trekking guide from Hunza with 3 years of experience. I specialize in moderate to difficult treks and love introducing visitors to the majestic peaks of Karakoram.",
          certifications: [
            "Basic Mountain Guide",
            "First Aid Certified",
            "Local Heritage Expert"
          ],
          completedTours: 280,
          happyClients: 310,
          responseTime: "Within 2 hours",
          phone: "+92 3XX XXXXXXX",
          email: "zakir.guide@voyagex.com",
          gallery: ["/hunza.jpg", "/skardu.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Bilal Ahmed",
              userImage: "/user3.jpg",
              rating: 4,
              comment: "Very friendly guide, knows all the best viewpoints.",
              date: "3 weeks ago"
            }
          ]
        },
        {
          id: 3,
          name: "Yasir",
          image: "/guid 3.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          region: "Gilgit Baltistan",
          experience: "4+ years",
          languages: ["Urdu", "English"],
          bio: "Professional trekking guide with 4 years of experience in Karakoram mountains. Certified by Alpine Club of Pakistan.",
          certifications: [
            "Alpine Club Certified Guide",
            "Wilderness First Aid",
            "High Altitude Rescue Training"
          ],
          completedTours: 380,
          happyClients: 410,
          responseTime: "Within 30 minutes",
          phone: "+92 3XX XXXXXXX",
          email: "yasir.guide@voyagex.com",
          gallery: ["/hunza.jpg", "/skardu.jpg", "/swat.jpg", "/kalam.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Kamran Ali",
              userImage: "/user4.jpg",
              rating: 5,
              comment: "Excellent guide! Made our Hunza trip unforgettable.",
              date: "1 week ago"
            }
          ]
        },
        {
          id: 4,
          name: "Muhammad",
          image: "/guid 4.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 4,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          region: "Gilgit Baltistan",
          experience: "6+ years",
          languages: ["Urdu", "English", "Burushaski"],
          bio: "Veteran guide with 6+ years of experience. Specializes in cultural tours and historical sites of Hunza Valley.",
          certifications: [
            "Senior Mountain Guide",
            "Cultural Heritage Specialist",
            "Advanced First Aid"
          ],
          completedTours: 520,
          happyClients: 580,
          responseTime: "Within 1 hour",
          phone: "+92 3XX XXXXXXX",
          email: "muhammad.guide@voyagex.com",
          gallery: ["/hunza.jpg", "/skardu.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Nadia Shah",
              userImage: "/user5.jpg",
              rating: 4,
              comment: "Very knowledgeable about local history and culture.",
              date: "2 months ago"
            }
          ]
        },
        {
          id: 5,
          name: "Ali Hassan",
          image: "/guid 1.jpg",
          location: "Skardu, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 3500,
          specialty: "Mountain Climbing",
          region: "Gilgit Baltistan",
          experience: "7+ years",
          languages: ["Urdu", "English"],
          bio: "Expert mountain climber from Skardu with 7+ years of experience. Have guided expeditions to K2 Base Camp, Gondogoro La, and various peaks in Karakoram.",
          certifications: [
            "International Mountain Guide",
            "High Altitude Climbing Specialist",
            "Avalanche Safety Certified",
            "Wilderness EMT"
          ],
          completedTours: 320,
          happyClients: 350,
          responseTime: "Within 2 hours",
          phone: "+92 3XX XXXXXXX",
          email: "ali.guide@voyagex.com",
          whatsapp: "+92 3XX XXXXXXX",
          gallery: ["/skardu.jpg", "/hunza.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Usman Malik",
              userImage: "/user6.jpg",
              rating: 5,
              comment: "Ali is a legend! He safely guided us to K2 Base Camp. Incredible experience!",
              date: "3 months ago"
            }
          ]
        },
        {
          id: 6,
          name: "Ahmed Khan",
          image: "/guid 2.jpg",
          location: "Naran, Khyber Pakhtunkhwa",
          rating: 4,
          pricePerDay: 2500,
          specialty: "Camping, Fishing",
          region: "Khyber Pakhtunkhwa",
          experience: "3+ years",
          languages: ["Urdu", "Pashto"],
          bio: "Local guide from Naran Valley. Expert in camping trips, fishing expeditions, and family tours in the beautiful Kaghan Valley.",
          certifications: [
            "Camping Guide Specialist",
            "Fishing Guide License",
            "First Aid Certified"
          ],
          completedTours: 210,
          happyClients: 240,
          responseTime: "Within 3 hours",
          phone: "+92 3XX XXXXXXX",
          email: "ahmed.guide@voyagex.com",
          gallery: ["/swat.jpg", "/kalam.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Farah Ahmed",
              userImage: "/user7.jpg",
              rating: 4,
              comment: "Great guide for families. Very patient with children.",
              date: "1 month ago"
            }
          ]
        },
        {
          id: 7,
          name: "Sara Ahmed",
          image: "/female1.jpg",
          location: "Swat, Khyber Pakhtunkhwa",
          rating: 5,
          pricePerDay: 2800,
          specialty: "Cultural Tours",
          region: "Khyber Pakhtunkhwa",
          experience: "4+ years",
          languages: ["Urdu", "English", "Pashto"],
          bio: "Female guide specializing in cultural and heritage tours of Swat Valley. I provide comfortable guiding experiences for female travelers and families.",
          certifications: [
            "Cultural Heritage Guide",
            "Women's Travel Specialist",
            "Museum Guide Certified"
          ],
          completedTours: 290,
          happyClients: 320,
          responseTime: "Within 1 hour",
          phone: "+92 3XX XXXXXXX",
          email: "sara.guide@voyagex.com",
          whatsapp: "+92 3XX XXXXXXX",
          gallery: ["/swat.jpg", "/kalam.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Ayesha Khan",
              userImage: "/user8.jpg",
              rating: 5,
              comment: "Sara is amazing! She made our all-female group feel very comfortable and safe.",
              date: "2 weeks ago"
            }
          ]
        },
        {
          id: 8,
          name: "Usman Ali",
          image: "/guid 4.jpg",
          location: "Murree, Punjab",
          rating: 4,
          pricePerDay: 2000,
          specialty: "Family Tours",
          region: "Punjab",
          experience: "5+ years",
          languages: ["Urdu", "English", "Punjabi"],
          bio: "Experienced guide from Murree Hills. Specializes in family-friendly tours and day trips in Punjab's hill stations.",
          certifications: [
            "Family Tour Specialist",
            "Local History Expert",
            "Child Safety Certified"
          ],
          completedTours: 410,
          happyClients: 450,
          responseTime: "Within 2 hours",
          phone: "+92 3XX XXXXXXX",
          email: "usman.guide@voyagex.com",
          gallery: ["/murree.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Imran Ali",
              userImage: "/user9.jpg",
              rating: 4,
              comment: "Very good guide for families. Knows all the kid-friendly spots.",
              date: "3 weeks ago"
            }
          ]
        },
        {
          id: 9,
          name: "Bilal Khan",
          image: "/guid 1.jpg",
          location: "Fairy Meadows, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 4000,
          specialty: "Adventure Trekking",
          region: "Gilgit Baltistan",
          experience: "8+ years",
          languages: ["Urdu", "English"],
          bio: "Senior adventure guide based at Fairy Meadows. Expert in high-altitude trekking and Nanga Parbat expeditions.",
          certifications: [
            "Advanced Mountain Guide",
            "High Altitude Specialist",
            "Glacier Travel Expert",
            "Wilderness First Responder"
          ],
          completedTours: 380,
          happyClients: 410,
          responseTime: "Within 30 minutes",
          phone: "+92 3XX XXXXXXX",
          email: "bilal.guide@voyagex.com",
          whatsapp: "+92 3XX XXXXXXX",
          gallery: ["/fairy.jpg", "/nanga.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Zafar Iqbal",
              userImage: "/user10.jpg",
              rating: 5,
              comment: "Bilal is the best guide for Fairy Meadows. Very experienced and safety conscious.",
              date: "2 months ago"
            }
          ]
        },
        {
          id: 10,
          name: "Nadia Shah",
          image: "/female2.jpg",
          location: "Kalam, Khyber Pakhtunkhwa",
          rating: 4,
          pricePerDay: 2700,
          specialty: "Photography Tours",
          region: "Khyber Pakhtunkhwa",
          experience: "3+ years",
          languages: ["Urdu", "English"],
          bio: "Professional photographer and guide. Specializes in photography tours in Swat and Kalam valleys.",
          certifications: [
            "Professional Photography Guide",
            "Nature Photography Specialist",
            "Drone Pilot Certified"
          ],
          completedTours: 180,
          happyClients: 210,
          responseTime: "Within 2 hours",
          phone: "+92 3XX XXXXXXX",
          email: "nadia.guide@voyagex.com",
          gallery: ["/kalam.jpg", "/swat.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Hamza Ali",
              userImage: "/user11.jpg",
              rating: 4,
              comment: "Great photography guide! She knew all the best spots for sunrise shots.",
              date: "1 month ago"
            }
          ]
        },
        {
          id: 11,
          name: "Kamran Malik",
          image: "/guid 3.jpg",
          location: "Neelum Valley, Azad Kashmir",
          rating: 5,
          pricePerDay: 3200,
          specialty: "River Rafting",
          region: "Azad Kashmir",
          experience: "6+ years",
          languages: ["Urdu", "English", "Kashmiri"],
          bio: "River rafting expert from Neelum Valley. Certified white water rafting guide with 6+ years of experience.",
          certifications: [
            "White Water Rafting Guide",
            "Swift Water Rescue",
            "CPR & First Aid"
          ],
          completedTours: 340,
          happyClients: 380,
          responseTime: "Within 1 hour",
          phone: "+92 3XX XXXXXXX",
          email: "kamran.guide@voyagex.com",
          whatsapp: "+92 3XX XXXXXXX",
          gallery: ["/neelum.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Shahid Mir",
              userImage: "/user12.jpg",
              rating: 5,
              comment: "Best rafting guide in Neelum Valley! Very professional and safety conscious.",
              date: "3 weeks ago"
            }
          ]
        },
        {
          id: 12,
          name: "Fatima Noor",
          image: "/female3.jpg",
          location: "Chitral, Khyber Pakhtunkhwa",
          rating: 4,
          pricePerDay: 2900,
          specialty: "Cultural Heritage",
          region: "Khyber Pakhtunkhwa",
          experience: "4+ years",
          languages: ["Urdu", "English", "Khowar"],
          bio: "Cultural heritage guide from Chitral. Expert in Kalash valleys, local traditions, and Chitrali culture.",
          certifications: [
            "Cultural Heritage Specialist",
            "UNESCO Site Guide",
            "Local History Expert"
          ],
          completedTours: 260,
          happyClients: 290,
          responseTime: "Within 2 hours",
          phone: "+92 3XX XXXXXXX",
          email: "fatima.guide@voyagex.com",
          gallery: ["/chitral.jpg", "/kalash.jpg"],
          reviews: [
            {
              id: 1,
              userName: "Tariq Khan",
              userImage: "/user13.jpg",
              rating: 4,
              comment: "Fatima is very knowledgeable about Kalash culture and traditions.",
              date: "2 months ago"
            }
          ]
        }
      ];

      // Find guide by name (from slug)
      const guideData = mockGuides.find(g => 
        g.name.toLowerCase().replace(/\s+/g, '-') === guideSlug.toLowerCase()
      ) || mockGuides[0];

      setGuide(guideData);
      setLoading(false);
    };

    if (params.slug) {
      fetchGuideProfile();
    }
  }, [params.slug]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={`w-5 h-5 ${
              index < rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const handleMessageClick = () => {
    if (guide) {
      router.push(`/Messages/${guide.id}`);
    }
  };

  const handleBookNow = () => {
    if (guide) {
      router.push(`/booking?guideId=${guide.id}&guideName=${encodeURIComponent(guide.name)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mb-4"></div>
            <p className="text-gray-600">Loading guide profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Guide not found</h1>
            <Link
              href="/Guide"
              className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
            >
              <FaArrowLeft /> Back to Guides
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/Guide")}
            className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium transition-colors"
          >
            <FaArrowLeft /> Back to Guides
          </button>
        </div>

        {/* Hero Section - Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Profile Image */}
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#008A1E] mx-auto md:mx-0 flex-shrink-0">
              <Image
                src={guide.image}
                alt={guide.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 128px, 160px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center';
                    fallback.innerHTML = `<span class="text-gray-800 font-medium text-lg">${guide.name.charAt(0)}</span>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {guide.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2">
                      {renderStars(guide.rating)}
                      <span className="text-gray-700 font-medium">{guide.rating}.0</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <FaMapMarkerAlt className="text-[#008A1E]" />
                      <span>{guide.location}</span>
                    </div>
                  </div>
                </div>
                
                {/* Price Badge */}
                <div className="bg-[#E6F4EA] px-6 py-3 rounded-xl">
                  <p className="text-sm text-gray-600">Price per day</p>
                  <p className="text-2xl font-bold text-[#008A1E]">{guide.pricePerDay.toLocaleString()} PKR</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto md:mx-0">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{guide.completedTours}+</p>
                  <p className="text-xs text-gray-600">Tours</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{guide.happyClients}+</p>
                  <p className="text-xs text-gray-600">Clients</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{guide.experience}</p>
                  <p className="text-xs text-gray-600">Experience</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBookNow}
                  className="flex-1 px-6 py-3 bg-[#008A1E] text-white font-semibold rounded-lg hover:bg-[#006816] transition-colors flex items-center justify-center gap-2"
                >
                  <FaBriefcase className="w-4 h-4" />
                  Book Now
                </button>
                <button
                  onClick={handleMessageClick}
                  className="flex-1 px-6 py-3 bg-[#E6F4EA] text-gray-900 font-semibold rounded-lg hover:bg-[#D6E6DD] transition-colors flex items-center justify-center gap-2"
                >
                  <FaEnvelope className="w-4 h-4" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - About & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === "about"
                      ? "text-[#008A1E] border-b-2 border-[#008A1E] bg-[#E6F4EA]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === "reviews"
                      ? "text-[#008A1E] border-b-2 border-[#008A1E] bg-[#E6F4EA]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Reviews ({guide.reviews?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("gallery")}
                  className={`flex-1 px-6 py-4 font-medium text-sm transition-colors ${
                    activeTab === "gallery"
                      ? "text-[#008A1E] border-b-2 border-[#008A1E] bg-[#E6F4EA]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Gallery
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* About Tab */}
                {activeTab === "about" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Bio</h3>
                      <p className="text-gray-700 leading-relaxed">{guide.bio}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {guide.certifications.map((cert, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                          >
                            <FaCertificate className="w-4 h-4 text-[#008A1E]" />
                            <span className="text-sm text-gray-700">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {guide.languages.map((language, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                          >
                            <FaLanguage className="w-4 h-4 text-[#008A1E]" />
                            <span className="text-sm text-gray-700">{language}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {guide.specialty.split(',').map((spec, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#008A1E] text-white text-sm rounded-full"
                          >
                            {spec.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    {guide.reviews && guide.reviews.length > 0 ? (
                      guide.reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <div className="flex items-start gap-3 mb-2">
                            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {review.userImage ? (
                                <Image
                                  src={review.userImage}
                                  alt={review.userName}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-[#008A1E] text-white font-medium">
                                  {review.userName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                                <span className="text-xs text-gray-500">{review.date}</span>
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {renderStars(review.rating)}
                              </div>
                              <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 text-center py-4">No reviews yet</p>
                    )}
                  </div>
                )}

                {/* Gallery Tab */}
                {activeTab === "gallery" && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {guide.gallery && guide.gallery.length > 0 ? (
                      guide.gallery.map((image, index) => (
                        <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                          <Image
                            src={image}
                            alt={`${guide.name} - Gallery ${index + 1}`}
                            fill
                            className="object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full">
                        <p className="text-gray-600 text-center py-4">No gallery images available</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Contact & Quick Info */}
          <div className="space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                {guide.phone && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaPhone className="w-4 h-4 text-[#008A1E]" />
                    <span className="text-sm">{guide.phone}</span>
                  </div>
                )}
                {guide.whatsapp && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaWhatsapp className="w-4 h-4 text-green-600" />
                    <span className="text-sm">{guide.whatsapp}</span>
                  </div>
                )}
                {guide.email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MdOutlineMail className="w-4 h-4 text-[#008A1E]" />
                    <span className="text-sm">{guide.email}</span>
                  </div>
                )}
                {guide.website && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <FaGlobe className="w-4 h-4 text-[#008A1E]" />
                    <span className="text-sm">{guide.website}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Region</span>
                  <span className="font-medium text-gray-900">{guide.region}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium text-gray-900">{guide.experience}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium text-green-600">{guide.responseTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price/Day</span>
                  <span className="font-bold text-[#008A1E]">{guide.pricePerDay.toLocaleString()} PKR</span>
                </div>
              </div>

              {/* Message Button in Quick Info */}
              <button
                onClick={handleMessageClick}
                className="w-full mt-4 px-4 py-2 bg-[#E6F4EA] text-gray-900 font-medium rounded-lg hover:bg-[#D6E6DD] transition-colors flex items-center justify-center gap-2"
              >
                <FaEnvelope className="w-4 h-4" />
                Message {guide.name.split(' ')[0]}
              </button>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect</h3>
              <div className="flex gap-3">
                <button className="w-10 h-10 bg-[#E6F4EA] rounded-full flex items-center justify-center text-[#008A1E] hover:bg-[#D6E6DD] transition-colors">
                  <FaTwitter className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-[#E6F4EA] rounded-full flex items-center justify-center text-[#008A1E] hover:bg-[#D6E6DD] transition-colors">
                  <FaFacebookF className="w-4 h-4" />
                </button>
                <button className="w-10 h-10 bg-[#E6F4EA] rounded-full flex items-center justify-center text-[#008A1E] hover:bg-[#D6E6DD] transition-colors">
                  <FaInstagram className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#008a1e] text-white pt-12 pb-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">VoyageX</div>
              <p className="text-gray-200 mb-6 text-sm leading-relaxed">
                Lorem ipsum dolor sit amet consectetur. Tincidunt bibendum mauris
                ultricies eu lacus. Nulla tincidunt diam risus nullam euismod lore
              </p>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#005a14] transition-colors">
                  <FaTwitter className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#005a14] transition-colors">
                  <FaFacebookF className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#005a14] transition-colors">
                  <FaInstagram className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["Home", "About", "Packages", "Destination", "Contact"].map(
                  (item) => (
                    <li
                      key={item}
                      className="text-gray-200 hover:text-white cursor-pointer transition-colors"
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Help Center</h3>
              <ul className="space-y-2">
                {[
                  "Terms & Services",
                  "Privacy",
                  "Cancelation Policy",
                  "Report",
                  "Support Team",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-gray-200 hover:text-white cursor-pointer transition-colors"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Now Here ?</h3>
              <p className="text-gray-200 mb-4 text-sm">
                Subscribe to get special offers and travel tips
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-2xl border-none outline-none text-gray-800 text-sm"
                />
                <button className="w-full px-4 py-3 bg-[#D6FFDF] text-gray-800 rounded-2xl font-medium hover:bg-white transition-colors">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}