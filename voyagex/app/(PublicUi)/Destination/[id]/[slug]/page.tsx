"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaCalendar, 
  FaUsers, 
  FaArrowLeft, 
  FaCheck,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaMoneyBillWave,
  FaHotel,
  FaCar,
  FaUserFriends
} from "react-icons/fa";
import { MdOutlineLocalOffer, MdRestaurant } from "react-icons/md";
import Navbar from "@/Components/navbar";

interface DestinationDetail {
  id: number;
  name: string;
  image: string;
  rating: number;
  price: number;
  packages: number;
  region: string;
  duration: string;
  description: string;
  author: string;
  capacity: string;
  isPopular?: boolean;
  discount?: number;
  highlights: string[];
  bestTimeToVisit: string;
  difficulty: string;
  included: string[];
  itinerary: { day: number; title: string; activities: string[] }[];
}

export default function DestinationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [destinationDetail, setDestinationDetail] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDestinationDetail = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const destinationId = Number(params.id);
      const destinationSlug = params.slug as string;
      
      // Mock data matching your Destination page
      const mockDestinations: { [key: number]: DestinationDetail } = {
        1: {
          id: 1,
          name: "Hunza",
          image: "/hunza.jpg",
          rating: 5,
          price: 15000,
          packages: 5,
          region: "Northern Areas",
          duration: "5-7 Days",
          description: "Hunza Valley is a mountainous valley in the Gilgit-Baltistan region of Pakistan. Known for its breathtaking scenery, friendly locals, and ancient forts, it's often called 'Heaven on Earth'.",
          author: "By Muhammad Umair",
          capacity: "14/20",
          isPopular: true,
          discount: 15,
          highlights: [
            "Visit Altit and Baltit Forts",
            "Experience Attabad Lake boat ride",
            "See the majestic Passu Cones",
            "Explore Khunjerab Pass (Pakistan-China border)",
            "Enjoy traditional Hunza cuisine"
          ],
          bestTimeToVisit: "April to October",
          difficulty: "Easy to Moderate",
          included: [
            "Hotel accommodation",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees",
            "Travel insurance"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Hunza", 
              activities: ["Arrive at Hunza", "Check into hotel", "Visit Karimabad Bazaar", "Evening walk around Karimabad"] 
            },
            { 
              day: 2, 
              title: "Altit & Baltit Forts", 
              activities: ["Visit Altit Fort", "Explore Baltit Fort", "Learn about Hunza history", "Local cultural experience"] 
            },
            { 
              day: 3, 
              title: "Attabad Lake & Passu", 
              activities: ["Boat ride on Attabad Lake", "See Passu Cones", "Visit Passu Glacier", "Photography session"] 
            }
          ]
        },
        2: {
          id: 2,
          name: "Skardu",
          image: "/skardu.jpg",
          rating: 5,
          price: 15000,
          packages: 5,
          region: "Northern Areas",
          duration: "7-10 Days",
          description: "Skardu is the gateway to the world's highest mountains and serves as a base for the mighty K2. It offers stunning landscapes, crystal clear lakes, and adventurous trekking routes.",
          author: "By Ali Khan",
          capacity: "12/20",
          isPopular: true,
          highlights: [
            "Shangrila Resort and Lower Kachura Lake",
            "Upper Kachura Lake",
            "Kharpocho Fort",
            "Deosai National Park",
            "Satpara Lake"
          ],
          bestTimeToVisit: "May to September",
          difficulty: "Moderate",
          included: [
            "Hotel accommodation",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees",
            "Travel insurance"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Skardu", 
              activities: ["Arrival at Skardu", "Hotel check-in", "Acclimatization walk", "Local market visit"] 
            },
            { 
              day: 2, 
              title: "Shangrila Resort", 
              activities: ["Visit Shangrila Resort", "Explore Lower Kachura Lake", "Boat ride", "Photography"] 
            },
            { 
              day: 3, 
              title: "Upper Kachura Lake", 
              activities: ["Trek to Upper Kachura Lake", "Picnic lunch", "Nature walk", "Return to hotel"] 
            }
          ]
        },
        3: {
          id: 3,
          name: "Kalam",
          image: "/kalam.jpg",
          rating: 5,
          price: 15000,
          packages: 5,
          region: "Khyber Pakhtunkhwa",
          duration: "3-5 Days",
          description: "Kalam Valley is known as the Switzerland of Pakistan. With its lush green meadows, pine forests, and gushing rivers, it's a perfect getaway for nature lovers.",
          author: "By Sara Ahmed",
          capacity: "16/20",
          discount: 10,
          highlights: [
            "Visit Ushu Forest",
            "Explore Mahodand Lake",
            "See beautiful waterfalls",
            "Experience local culture",
            "Trekking adventures"
          ],
          bestTimeToVisit: "May to October",
          difficulty: "Easy",
          included: [
            "Hotel accommodation",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees",
            "Travel insurance"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Kalam", 
              activities: ["Arrive at Kalam", "Hotel check-in", "Visit Kalam town", "Evening walk"] 
            },
            { 
              day: 2, 
              title: "Ushu Forest & Matiltan", 
              activities: ["Trek through Ushu Forest", "Visit Matiltan", "Picnic lunch", "Photography"] 
            },
            { 
              day: 3, 
              title: "Mahodand Lake", 
              activities: ["Jeep ride to Mahodand Lake", "Boat ride", "Fishing (optional)", "Return to hotel"] 
            }
          ]
        },
        4: {
          id: 4,
          name: "Swat",
          image: "/swat.jpg",
          rating: 5,
          price: 15000,
          packages: 5,
          region: "Khyber Pakhtunkhwa",
          duration: "3-4 Days",
          description: "Swat Valley, also known as the Switzerland of the East, is famous for its stunning natural beauty, historical sites, and pleasant climate throughout the year.",
          author: "By Usman Ali",
          capacity: "18/20",
          highlights: [
            "Malam Jabba ski resort",
            "Mahodand Lake",
            "Marghazar Valley",
            "Swat Museum",
            "Mingora Bazaar"
          ],
          bestTimeToVisit: "March to November",
          difficulty: "Easy",
          included: [
            "Hotel accommodation",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees",
            "Travel insurance"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Swat", 
              activities: ["Arrive at Swat", "Hotel check-in", "Visit Mingora Bazaar", "Traditional dinner"] 
            },
            { 
              day: 2, 
              title: "Malam Jabba", 
              activities: ["Visit Malam Jabba ski resort", "Cable car ride", "Lunch at resort", "Return to hotel"] 
            },
            { 
              day: 3, 
              title: "Mahodand Lake", 
              activities: ["Jeep ride to Mahodand Lake", "Boat ride", "Picnic", "Photography session"] 
            }
          ]
        }
      };
      
      const data = mockDestinations[destinationId] || mockDestinations[1];
      setDestinationDetail(data);
      setLoading(false);
    };

    if (params.id) {
      fetchDestinationDetail();
    }
  }, [params.id]);

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

  const formatPrice = (price: number) => {
    return `Rs:${price.toLocaleString()}`;
  };

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

  if (!destinationDetail) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Destination not found</h1>
            <Link 
              href="/Destination" // UPDATED: /Destination with uppercase D
              className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
            >
              <FaArrowLeft /> Back to Destinations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
          >
            <FaArrowLeft /> Back to Destinations
          </button>
        </div>

        {/* Destination Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                {destinationDetail.isPopular && (
                  <span className="bg-[#008A1E] text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Popular Destination
                  </span>
                )}
                {destinationDetail.discount && (
                  <span className="bg-[#FFD700] text-gray-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <MdOutlineLocalOffer className="w-4 h-4" />
                    {destinationDetail.discount}% OFF
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{destinationDetail.name}</h1>
              <p className="text-gray-600 mb-4 text-lg">{destinationDetail.author}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(destinationDetail.rating)}
                  <span className="text-gray-700">{destinationDetail.rating}.0 Rating</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaCalendar className="text-[#008A1E]" />
                  <span>{destinationDetail.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaUsers className="text-[#008A1E]" />
                  <span>Capacity: {destinationDetail.capacity}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt className="text-[#008A1E]" />
                  <span>{destinationDetail.region}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="text-3xl font-bold text-[#008A1E]">
                  {formatPrice(destinationDetail.price)}
                </div>
                <div className="text-lg text-gray-700">
                  <span className="font-semibold">{destinationDetail.packages}</span> packages available
                </div>
              </div>

              <p className="text-gray-700 text-lg mb-6">
                {destinationDetail.description}
              </p>
            </div>

            <div className="lg:w-80">
              <div className="bg-[#E6F4EA] rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Destination Info</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Time to Visit:</span>
                    <span className="font-medium text-gray-800">{destinationDetail.bestTimeToVisit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty Level:</span>
                    <span className="font-medium text-gray-800">{destinationDetail.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available Packages:</span>
                    <span className="font-medium text-gray-800">{destinationDetail.packages}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image & Highlights */}
          <div className="lg:col-span-2 space-y-6">
            {/* Destination Image */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src={destinationDetail.image}
                alt={destinationDetail.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center';
                    fallback.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-gray-800 mb-2">${destinationDetail.name}</h3><p class="text-gray-600">Beautiful Destination</p></div>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

            {/* Highlights */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Destination Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destinationDetail.highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <FaCheck className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Itinerary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Sample Itinerary</h2>
              <div className="space-y-6">
                {destinationDetail.itinerary.map((day) => (
                  <div key={day.day} className="border-l-4 border-[#008A1E] pl-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#008A1E] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">Day {day.day}</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800">{day.title}</h3>
                    </div>
                    <ul className="space-y-2 pl-7">
                      {day.activities.map((activity, index) => (
                        <li key={index} className="text-gray-600 flex items-start gap-2">
                          <span className="w-2 h-2 bg-[#008A1E] rounded-full mt-2 flex-shrink-0"></span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking & Included */}
          <div className="space-y-6">
            {/* What's Included */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">What's Included</h2>
              <ul className="space-y-4">
                {destinationDetail.included.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {index === 0 && <FaHotel className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />}
                    {index === 1 && <MdRestaurant className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />}
                    {index === 2 && <FaUserFriends className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />}
                    {index === 3 && <FaCar className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />}
                    {index === 4 && <FaMoneyBillWave className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />}
                    {index >= 5 && <FaCheck className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />}
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Book Now Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Explore Packages</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Starting from</span>
                  <span className="text-xl font-bold text-[#008A1E]">{formatPrice(destinationDetail.price)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Duration</span>
                  <span className="font-medium text-gray-800">{destinationDetail.duration}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Available spots</span>
                  <span className="font-medium text-gray-800">{destinationDetail.capacity}</span>
                </div>
              </div>

              <button className="
                w-full
                py-4
                bg-[#008A1E]
                text-white
                font-semibold
                text-lg
                rounded-xl
                hover:bg-[#006816]
                transition-colors
                duration-300
                shadow-md
                hover:shadow-lg
              ">
                View All Packages
              </button>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                Choose from {destinationDetail.packages} different packages for {destinationDetail.name}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Same as Destination page */}
      <footer className="bg-[#008a1e] text-white pt-12 pb-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
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

            {/* Quick Links */}
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

            {/* Help Center */}
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

            {/* Newsletter */}
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