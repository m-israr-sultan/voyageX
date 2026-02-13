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
  FaInstagram 
} from "react-icons/fa";
import Navbar from "@/Components/navbar";

interface PackageDetail {
  id: number;
  name: string;
  image: string;
  rating: number;
  price: string;
  capacity: string;
  duration: string;
  author: string;
  description: string;
  inclusions: string[];
  itinerary: { day: number; title: string; description: string }[];
  location: string;
  difficulty: string;
  groupSize: string;
  bestSeason: string;
}

export default function PackageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [packageDetail, setPackageDetail] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackageDetail = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the slug from params
      const packageSlug = params.slug as string;
      
      // Convert slug back to package name for matching
      const packageName = packageSlug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      // Mock packages data - matching the listing page data
      const mockPackages: PackageDetail[] = [
        {
          id: 1,
          name: "3 Days in Swat",
          image: "/swat.jpg",
          rating: 5,
          price: "24,000 Pkr",
          capacity: "14/20",
          duration: "3 Days",
          author: "By Muhammad Umair",
          description: "Experience the breathtaking beauty of Swat Valley with our 3-day guided tour. Visit the most scenic spots, enjoy local cuisine, and create unforgettable memories in the Switzerland of the East.",
          inclusions: [
            "Accommodation for 2 nights in 3-star hotels",
            "All meals included (Breakfast, Lunch, Dinner)",
            "Professional English-speaking guide",
            "Private transportation throughout the tour",
            "All entrance fees to attractions",
            "Travel insurance coverage",
            "Bottled water during travel",
            "First-aid kit available"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Swat Valley", 
              description: "Arrive at Swat, transfer to hotel. After settling in, we'll take an evening tour of the local Mingora bazaar. Enjoy traditional Swati cuisine for dinner." 
            },
            { 
              day: 2, 
              title: "Full Day Sightseeing", 
              description: "Visit Malam Jabba ski resort, Mahodand Lake (Queen of Lakes), and explore the beautiful Marghazar Valley. Experience local culture and scenic views." 
            },
            { 
              day: 3, 
              title: "Departure with Memories", 
              description: "Morning hike to Swat Museum to explore Gandhara civilization artifacts. After breakfast, departure with beautiful memories of Swat Valley." 
            }
          ],
          location: "Swat Valley, Khyber Pakhtunkhwa",
          difficulty: "Easy to Moderate",
          groupSize: "Small Groups (6-20 people)",
          bestSeason: "March to November"
        },
        {
          id: 2,
          name: "5 Days in Hunza",
          image: "/hunza.jpg",
          rating: 5,
          price: "35,000 Pkr",
          capacity: "12/20",
          duration: "5 Days",
          author: "By Ali Khan",
          description: "Discover the majestic beauty of Hunza Valley with our 5-day adventure. Experience breathtaking views, ancient forts, and warm hospitality in the heart of Gilgit-Baltistan.",
          inclusions: [
            "Accommodation for 4 nights",
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
              description: "Arrive at Hunza, check into hotel, visit Karimabad bazaar and enjoy panoramic views of Rakaposhi mountain." 
            },
            { 
              day: 2, 
              title: "Altit & Baltit Forts", 
              description: "Explore ancient Altit and Baltit forts dating back to 800 years. Learn about Hunza culture and history." 
            },
            { 
              day: 3, 
              title: "Attabad Lake", 
              description: "Boat ride on the stunning turquoise waters of Attabad Lake, visit Passu Cones and Suspension Bridge." 
            },
            { 
              day: 4, 
              title: "Khunjerab Pass", 
              description: "Day trip to Khunjerab Pass (15,397 ft), Pakistan-China border. Spot Marco Polo sheep and enjoy high-altitude scenery." 
            },
            { 
              day: 5, 
              title: "Departure", 
              description: "Last minute shopping for local handicrafts, traditional breakfast, and departure with lifetime memories." 
            }
          ],
          location: "Hunza Valley, Gilgit-Baltistan",
          difficulty: "Moderate",
          groupSize: "Small Groups (8-20 people)",
          bestSeason: "April to October"
        },
        {
          id: 3,
          name: "7 Days in Skardu",
          image: "/skardu.jpg",
          rating: 5,
          price: "45,000 Pkr",
          capacity: "16/20",
          duration: "7 Days",
          author: "By Sara Ahmed",
          description: "Explore the gateway to the world's highest mountains with our 7-day Skardu tour. Visit Shangrila Resort, Upper Kachura Lake, and experience breathtaking landscapes.",
          inclusions: [
            "Accommodation for 6 nights",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees",
            "Travel insurance",
            "Photography assistance"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Skardu", 
              description: "Arrival at Skardu airport, transfer to hotel. Acclimatization walk around Skardu town." 
            },
            { 
              day: 2, 
              title: "Shangrila Resort", 
              description: "Visit the famous Shangrila Resort and Lower Kachura Lake. Enjoy boating and local cuisine." 
            },
            { 
              day: 3, 
              title: "Upper Kachura Lake", 
              description: "Explore the pristine Upper Kachura Lake, surrounded by majestic mountains." 
            },
            { 
              day: 4, 
              title: "Kharpocho Fort", 
              description: "Visit the ancient Kharpocho Fort overlooking the Indus River." 
            },
            { 
              day: 5, 
              title: "Deosai Plains", 
              description: "Day trip to Deosai National Park, the world's second highest plateau." 
            },
            { 
              day: 6, 
              title: "Satpara Lake", 
              description: "Visit Satpara Lake and the nearby villages to experience local culture." 
            },
            { 
              day: 7, 
              title: "Departure", 
              description: "Last morning in Skardu, breakfast, and departure to airport." 
            }
          ],
          location: "Skardu, Gilgit-Baltistan",
          difficulty: "Moderate to Difficult",
          groupSize: "Small Groups (6-15 people)",
          bestSeason: "May to September"
        },
        {
          id: 4,
          name: "10 Days in Kalam",
          image: "/kalam.jpg",
          rating: 5,
          price: "28,000 Pkr",
          capacity: "18/20",
          duration: "10 Days",
          author: "By Usman Ali",
          description: "Immerse yourself in the serene beauty of Kalam Valley with our 10-day tour. Experience local culture, hiking adventures, and natural wonders.",
          inclusions: [
            "Accommodation for 9 nights",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees",
            "Travel insurance",
            "Hiking equipment"
          ],
          itinerary: [
            { 
              day: 1, 
              title: "Arrival in Kalam", 
              description: "Arrival and transfer to hotel. Orientation and welcome dinner." 
            },
            { 
              day: 2, 
              title: "Local Exploration", 
              description: "Explore Kalam town, visit local markets and enjoy Swati culture." 
            },
            { 
              day: 3, 
              title: "Ushu Forest", 
              description: "Visit Ushu Forest and Matiltan, enjoy nature walks." 
            },
            { 
              day: 4, 
              title: "Mahodand Lake", 
              description: "Day trip to Mahodand Lake, enjoy boating and picnic." 
            },
            { 
              day: 5, 
              title: "Jahaz Banda", 
              description: "Trek to Jahaz Banda meadows for stunning views." 
            },
            { 
              day: 6, 
              title: "Cultural Day", 
              description: "Experience local culture, traditional music and dance." 
            },
            { 
              day: 7, 
              title: "Fishing Day", 
              description: "Try your hand at trout fishing in Swat River." 
            },
            { 
              day: 8, 
              title: "Free Day", 
              description: "Free day for personal exploration or relaxation." 
            },
            { 
              day: 9, 
              title: "Last Day Activities", 
              description: "Final sightseeing and shopping for souvenirs." 
            },
            { 
              day: 10, 
              title: "Departure", 
              description: "Breakfast and departure with beautiful memories." 
            }
          ],
          location: "Kalam Valley, Khyber Pakhtunkhwa",
          difficulty: "Easy to Moderate",
          groupSize: "Small Groups (10-20 people)",
          bestSeason: "May to October"
        },
        {
          id: 5,
          name: "4 Days in Swat Valley",
          image: "/swat.jpg",
          rating: 5,
          price: "22,000 Pkr",
          capacity: "15/20",
          duration: "4 Days",
          author: "By Muhammad Umair",
          description: "A shorter version of our Swat tour covering the main highlights of Swat Valley in 4 days.",
          inclusions: [
            "Accommodation for 3 nights",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees"
          ],
          itinerary: [
            { day: 1, title: "Arrival", description: "Arrival and hotel check-in." },
            { day: 2, title: "Sightseeing", description: "Visit main attractions." },
            { day: 3, title: "Adventure Day", description: "Hiking and outdoor activities." },
            { day: 4, title: "Departure", description: "Breakfast and departure." }
          ],
          location: "Swat Valley, Khyber Pakhtunkhwa",
          difficulty: "Easy",
          groupSize: "Small Groups (8-15 people)",
          bestSeason: "March to November"
        },
        {
          id: 6,
          name: "6 Days in Hunza Valley",
          image: "/hunza.jpg",
          rating: 5,
          price: "38,000 Pkr",
          capacity: "10/20",
          duration: "6 Days",
          author: "By Ali Khan",
          description: "Extended Hunza tour covering more attractions in the valley.",
          inclusions: [
            "Accommodation for 5 nights",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees"
          ],
          itinerary: [
            { day: 1, title: "Arrival", description: "Arrival and hotel check-in." },
            { day: 2, title: "Karimabad", description: "Explore Karimabad." },
            { day: 3, title: "Forts", description: "Visit ancient forts." },
            { day: 4, title: "Attabad Lake", description: "Boat ride at Attabad." },
            { day: 5, title: "Khunjerab", description: "Visit Khunjerab Pass." },
            { day: 6, title: "Departure", description: "Breakfast and departure." }
          ],
          location: "Hunza Valley, Gilgit-Baltistan",
          difficulty: "Moderate",
          groupSize: "Small Groups (8-12 people)",
          bestSeason: "April to October"
        },
        {
          id: 7,
          name: "8 Days in Skardu Tour",
          image: "/skardu.jpg",
          rating: 5,
          price: "48,000 Pkr",
          capacity: "14/20",
          duration: "8 Days",
          author: "By Sara Ahmed",
          description: "Comprehensive Skardu tour covering all major attractions.",
          inclusions: [
            "Accommodation for 7 nights",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees"
          ],
          itinerary: [
            { day: 1, title: "Arrival", description: "Arrival and hotel check-in." },
            { day: 2, title: "Shangrila", description: "Visit Shangrila Resort." },
            { day: 3, title: "Kachura", description: "Explore Kachura Lakes." },
            { day: 4, title: "Fort Visit", description: "Visit Kharpocho Fort." },
            { day: 5, title: "Deosai", description: "Trip to Deosai Plains." },
            { day: 6, title: "Satpara", description: "Visit Satpara Lake." },
            { day: 7, title: "Culture", description: "Cultural experiences." },
            { day: 8, title: "Departure", description: "Breakfast and departure." }
          ],
          location: "Skardu, Gilgit-Baltistan",
          difficulty: "Moderate",
          groupSize: "Small Groups (6-14 people)",
          bestSeason: "May to September"
        },
        {
          id: 8,
          name: "12 Days in Kalam Valley",
          image: "/kalam.jpg",
          rating: 5,
          price: "32,000 Pkr",
          capacity: "16/20",
          duration: "12 Days",
          author: "By Usman Ali",
          description: "Extended Kalam tour for nature lovers and adventure seekers.",
          inclusions: [
            "Accommodation for 11 nights",
            "All meals included",
            "Professional guide",
            "Transportation",
            "Entrance fees"
          ],
          itinerary: [
            { day: 1, title: "Arrival", description: "Arrival and hotel check-in." },
            { day: 2, title: "Exploration", description: "Explore Kalam town." },
            { day: 3, title: "Forest", description: "Visit Ushu Forest." },
            { day: 4, title: "Lake", description: "Trip to Mahodand Lake." },
            { day: 5, title: "Trekking", description: "Trek to Jahaz Banda." },
            { day: 6, title: "Culture", description: "Cultural activities." },
            { day: 7, title: "Fishing", description: "Fishing day." },
            { day: 8, title: "Relax", description: "Free day." },
            { day: 9, title: "Hiking", description: "Mountain hiking." },
            { day: 10, title: "Villages", description: "Visit local villages." },
            { day: 11, title: "Souvenirs", description: "Shopping day." },
            { day: 12, title: "Departure", description: "Breakfast and departure." }
          ],
          location: "Kalam Valley, Khyber Pakhtunkhwa",
          difficulty: "Moderate",
          groupSize: "Small Groups (10-16 people)",
          bestSeason: "May to October"
        }
      ];
      
      // Find package by name (from slug)
      const data = mockPackages.find(pkg => 
        pkg.name.toLowerCase().replace(/\s+/g, '-') === packageSlug.toLowerCase()
      ) || mockPackages[0];
      
      setPackageDetail(data);
      setLoading(false);
    };

    if (params.slug) {
      fetchPackageDetail();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mb-4"></div>
            <p className="text-gray-600">Loading package details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!packageDetail) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Package not found</h1>
            <Link 
              href="/Packages"
              className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
            >
              <FaArrowLeft /> Back to Packages
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
            onClick={() => router.push("/Packages")}
            className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
          >
            <FaArrowLeft /> Back to Packages
          </button>
        </div>

        {/* Package Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{packageDetail.name}</h1>
              <p className="text-gray-600 mb-4 text-lg">{packageDetail.author}</p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(packageDetail.rating)}
                  <span className="text-gray-700">{packageDetail.rating}.0 Rating</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaCalendar className="text-[#008A1E]" />
                  <span>{packageDetail.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaUsers className="text-[#008A1E]" />
                  <span>Capacity: {packageDetail.capacity}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FaMapMarkerAlt className="text-[#008A1E]" />
                  <span>{packageDetail.location}</span>
                </div>
              </div>

              <div className="text-3xl font-bold text-[#008A1E] mb-4">
                {packageDetail.price}
              </div>

              <p className="text-gray-700 mb-6">
                {packageDetail.description}
              </p>

            </div>

            <div className="lg:w-80">
              <div className="bg-[#E6F4EA] rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Facts</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Difficulty:</span>
                    <span className="font-medium text-gray-800">{packageDetail.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Group Size:</span>
                    <span className="font-medium text-gray-800">{packageDetail.groupSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Season:</span>
                    <span className="font-medium text-gray-800">{packageDetail.bestSeason}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image & Itinerary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Image */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <Image
                src={packageDetail.image}
                alt={packageDetail.name}
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
                    fallback.innerHTML = `<div class="text-center p-8"><h3 class="text-2xl font-bold text-gray-800 mb-2">${packageDetail.name}</h3><p class="text-gray-600">Beautiful Destination</p></div>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

            {/* Itinerary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Itinerary</h2>
              <div className="space-y-6">
                {packageDetail.itinerary.map((day) => (
                  <div key={day.day} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-[#008A1E] rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">Day {day.day}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{day.title}</h3>
                      <p className="text-gray-600">{day.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking & Inclusions */}
          <div className="space-y-6">
            {/* What's Included */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">What's Included</h2>
              <ul className="space-y-3">
                {packageDetail.inclusions.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FaCheck className="w-5 h-5 text-[#008A1E] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Book Now Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Book This Package</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Price per person</span>
                  <span className="text-xl font-bold text-[#008A1E]">{packageDetail.price}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Duration</span>
                  <span className="font-medium text-gray-800">{packageDetail.duration}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Available spots</span>
                  <span className="font-medium text-gray-800">{packageDetail.capacity}</span>
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
                Book Now
              </button>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                Only {packageDetail.capacity.split('/')[0]} spots left. Book now to secure your place!
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
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