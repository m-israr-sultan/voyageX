"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Icons
import {
  FaSearch,
  FaChevronDown,
  FaStar,
  FaArrowRight,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaUser,
} from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import Navbar from "@/Components/navbar";

interface Guide {
  id: number;
  name: string;
  image: string;
  location: string;
  rating: number;
  pricePerDay: number;
  specialty: string;
  region: string;
  experience?: string;
  languages?: string[];
}

interface SearchFilters {
  guideName: string;
  region: string;
  maxPrice: number;
  rating: number;
  date: Date | null;
  travelers: number;
  specialty: string;
}

// Custom Date Picker Component
const SimpleDatePicker = ({
  selectedDate,
  onChange,
}: {
  selectedDate: Date | null;
  onChange: (date: Date | null) => void;
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    onChange(selected);
    setShowPicker(false);
  };

  const clearDate = () => {
    onChange(null);
    setShowPicker(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 sm:gap-4 cursor-pointer">
          <div className="p-2 sm:p-3 bg-gray-100 rounded-lg">
            <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-normal text-gray-800">
              Select Dates
            </h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "When ?"}
            </p>
          </div>
          <FaChevronDown className="w-4 h-4 text-gray-500" />
        </div>
      </button>

      {showPicker && (
        <div className="absolute mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-64 sm:w-72 p-4">
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-sm sm:text-base">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div key={day} className="text-center text-xs font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, index) => (
              <div key={`empty-${index}`} className="h-8"></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <button
                key={day}
                onClick={() => handleDateSelect(day)}
                className={`h-8 rounded text-sm transition-colors ${
                  isSelected(day)
                    ? "bg-[#008A1E] text-white"
                    : isToday(day)
                      ? "bg-[#E6F4EA] text-[#008A1E]"
                      : "hover:bg-gray-100"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="flex justify-between mt-4 pt-4 border-t">
            <button
              onClick={() => {
                onChange(new Date());
                setShowPicker(false);
              }}
              className="px-3 py-1 text-sm text-[#008A1E] hover:bg-[#E6F4EA] rounded"
            >
              Today
            </button>
            <button
              onClick={clearDate}
              className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Mobile Search Modal Component
const MobileSearchModal = ({
  isOpen,
  onClose,
  filters,
  updateFilter,
  handleSearch,
  popularGuides,
  regions,
  specialties,
  clearAllFilters,
  isSearching,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  updateFilter: (key: keyof SearchFilters, value: any) => void;
  handleSearch: () => void;
  popularGuides: string[];
  regions: string[];
  specialties: string[];
  clearAllFilters: () => void;
  isSearching: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16">
      <div className="bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Search Guides</h3>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3">
              <FaSearch className="w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="Search Guides"
                className="flex-1 bg-transparent border-none outline-none text-gray-600 text-base"
                value={filters.guideName}
                onChange={(e) => updateFilter("guideName", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Popular Guides</h4>
            <div className="flex flex-wrap gap-2">
              {popularGuides.slice(0, 6).map((guide) => (
                <button
                  key={guide}
                  onClick={() => {
                    updateFilter("guideName", guide);
                    handleSearch();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {guide}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Region</h4>
              <div className="flex flex-wrap gap-2">
                {regions
                  .filter((region) => region !== "Select Region")
                  .map((region) => (
                    <button
                      key={region}
                      onClick={() => updateFilter("region", region)}
                      className={`px-3 py-2 rounded-full transition-colors text-sm ${
                        filters.region === region
                          ? "bg-[#008A1E] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Specialty</h4>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => updateFilter("specialty", specialty)}
                    className={`px-3 py-2 rounded-full transition-colors text-sm ${
                      filters.specialty === specialty
                        ? "bg-[#008A1E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Max Price Per Day</h4>
              <div className="flex flex-wrap gap-2">
                {[1000, 2000, 3000, 4000, 5000].map((price) => (
                  <button
                    key={price}
                    onClick={() => updateFilter("maxPrice", price)}
                    className={`px-3 py-2 rounded-full transition-colors text-sm ${
                      filters.maxPrice === price
                        ? "bg-[#008A1E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {price} PKR
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Rating</h4>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => updateFilter("rating", rating)}
                    className={`px-3 py-2 rounded-full flex items-center gap-2 text-sm ${
                      filters.rating === rating
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FaStar
                      className={`w-4 h-4 ${
                        filters.rating >= rating
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                    {rating}+
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => {
                handleSearch();
                onClose();
              }}
              disabled={isSearching}
              className="w-full py-3 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] disabled:opacity-50 font-medium"
            >
              {isSearching ? "Searching..." : "Search Guides"}
            </button>
            <button
              onClick={() => {
                clearAllFilters();
                onClose();
              }}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GuidePage = () => {
  const router = useRouter();

  // States
  const [filters, setFilters] = useState<SearchFilters>({
    guideName: "",
    region: "Select Region",
    maxPrice: 0,
    rating: 0,
    date: null,
    travelers: 1,
    specialty: "Any",
  });

  const [showDropdowns, setShowDropdowns] = useState({
    destinations: false,
    dates: false,
    regions: false,
    filters: false,
  });

  const [searchResults, setSearchResults] = useState<Guide[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Static data
  const guidesData: Guide[] = [
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
    },
  ];

  const popularGuides = [
    "Muhammad Afnan",
    "Zakir Ullah",
    "Yasir",
    "Muhammad",
    "Ali Hassan",
    "Ahmed Khan",
    "Sara Ahmed",
  ];

  const regions = [
    "Select Region",
    "Gilgit Baltistan",
    "Khyber Pakhtunkhwa",
    "Punjab",
    "Sindh",
    "Balochistan",
    "Azad Kashmir",
    "Islamabad",
  ];

  const specialties = [
    "Any",
    "Trekking",
    "Hiking",
    "Mountain Climbing",
    "Camping",
    "Cultural Tours",
    "Adventure Trekking",
    "Photography Tours",
    "Family Tours",
    "River Rafting",
  ];

  // Create slug from guide name
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Generate search suggestions
  const generateSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchSuggestions(popularGuides.slice(0, 5));
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = popularGuides
      .filter((guide) => guide.toLowerCase().includes(queryLower))
      .slice(0, 5);

    if (filtered.length === 0) {
      setSearchSuggestions([
        `Search for "${query}"`,
        ...popularGuides.slice(0, 4),
      ]);
    } else {
      setSearchSuggestions(filtered);
    }
  }, []);

  // Update suggestions when filter guideName changes
  useEffect(() => {
    generateSuggestions(filters.guideName);
  }, [filters.guideName, generateSuggestions]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Helper functions
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={`w-4 h-4 ${
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
    return `${price.toLocaleString()} PKR`;
  };

  // Handle filter changes
  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDropdown = (
    dropdown: keyof typeof showDropdowns,
    e?: React.MouseEvent,
  ) => {
    if (e) {
      e.stopPropagation();
    }
    setShowDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  // Handle View Profile button click - Navigate to guide profile page with slug
  const handleViewProfileClick = (guideName: string) => {
    const slug = createSlug(guideName);
    router.push(`/Guide/${slug}`);
  };

 // Handle Message button click - Navigate to messages page with guide ID
const handleMessageClick = (guideId: number) => {
  router.push(`/Messages/${guideId}`);  // Changed 'messages' to 'Messages'
};
  // Search function
  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchPerformed(true);
    setShowSuggestions(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      let results = [...guidesData];

      if (filters.guideName.trim() !== "") {
        results = results.filter((guide) =>
          guide.name.toLowerCase().includes(filters.guideName.toLowerCase()),
        );
      }

      if (filters.region !== "Select Region") {
        results = results.filter((guide) => guide.region === filters.region);
      }

      if (filters.rating > 0) {
        results = results.filter((guide) => guide.rating >= filters.rating);
      }

      if (filters.maxPrice > 0) {
        results = results.filter((guide) => guide.pricePerDay <= filters.maxPrice);
      }

      if (filters.specialty !== "Any") {
        results = results.filter((guide) =>
          guide.specialty.toLowerCase().includes(filters.specialty.toLowerCase()),
        );
      }

      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([...guidesData]);
    } finally {
      setIsSearching(false);
    }
  }, [filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      guideName: "",
      region: "Select Region",
      maxPrice: 0,
      rating: 0,
      date: null,
      travelers: 1,
      specialty: "Any",
    });
    setSearchResults([]);
    setSearchPerformed(false);
    setShowDropdowns({
      destinations: false,
      dates: false,
      regions: false,
      filters: false,
    });
    setShowSuggestions(false);
  };

  // Display guides
  const guidesToDisplay = searchPerformed ? searchResults : guidesData;

  // Guide Card Component
  const GuideCard = ({ guide }: { guide: Guide }) => {
    const slug = createSlug(guide.name);

    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[420px] flex flex-col">
        {/* Image Container - Clickable to profile */}
        <Link href={`/Guide/${slug}`} className="block relative h-48 overflow-hidden">
          <Image
            src={guide.image}
            alt={guide.name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const parent = target.parentElement;
              if (parent) {
                const fallback = document.createElement("div");
                fallback.className =
                  "absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center";
                fallback.innerHTML = `<span class="text-gray-800 font-medium">${guide.name}</span>`;
                parent.appendChild(fallback);
              }
            }}
          />
        </Link>

        {/* Content */}
        <div className="p-2 flex-1 flex flex-col">
          {/* Guide Name with Star - Clickable to profile */}
          <Link href={`/Guide/${slug}`} className="flex items-center gap-2 mb-2 group">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#008A1E] transition-colors">
              {guide.name}
            </h3>
            <FaStar className="w-4 h-4 text-yellow-500 fill-yellow-500 mt-2" />
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-600 mb-4">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span className="text-sm">{guide.location}</span>
          </div>

          {/* Rating and Info Section */}
          <div className="space-y-3 mb-4 flex-1">
            {/* Rating */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Rating</span>
              <div className="flex items-center gap-2">
                {renderStars(guide.rating)}
              </div>
            </div>

            {/* Price Per Day */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Price Per Day
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatPrice(guide.pricePerDay)}
              </span>
            </div>

            {/* Specialty */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Specialty
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {guide.specialty}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Link href={`/Guide/${slug}`} className="flex-1">
              <button className="w-full h-[31px] bg-[#008A1E] text-white font-medium rounded-lg hover:bg-[#006816] transition-colors text-sm flex items-center justify-center gap-2">
                <FaUser className="w-3 h-3" />
                View Profile
              </button>
            </Link>
            <button
              onClick={() => handleMessageClick(guide.id)}
              className="flex-1 h-[31px] bg-[#E6F4EA] text-gray-900 font-medium rounded-lg hover:bg-[#D6E6DD] transition-colors text-sm flex items-center justify-center gap-2"
            >
              <FaEnvelope className="w-3 h-3" />
              Message
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      {/* Mobile Search Modal */}
      <MobileSearchModal
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        popularGuides={popularGuides}
        regions={regions}
        specialties={specialties}
        clearAllFilters={clearAllFilters}
        isSearching={isSearching}
      />

      <Navbar/>

      {/* Hero Section with Background Image */}
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-[url('/Home.png')] bg-cover bg-no-repeat bg-center">
        {/* Mobile Search Button */}
        <div className="lg:hidden absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="w-12 h-12 bg-[#008A1E] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#006816] transition-colors"
            aria-label="Search"
          >
            <FaSearch className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar - Only show on large screens */}
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 flex justify-center px-4 mb-20">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[809px] h-[136px] p-6 mx-auto z-10">
            <div className="flex items-center justify-between h-full gap-4">
              {/* Destinations */}
              <div className="flex-1 border-r border-gray-300 pr-8 relative">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={(e) => toggleDropdown("destinations", e)}
                >
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-normal text-gray-800">
                      Destinations
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filters.guideName || "Where to ?"}
                    </p>
                  </div>
                  <FaChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {/* Destinations Dropdown */}
                {showDropdowns.destinations && (
                  <div className="absolute mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-64">
                    <div className="p-3">
                      <input
                        type="text"
                        placeholder="Search destination..."
                        className="w-full p-2 mb-2 border border-gray-300 rounded text-sm"
                        value={filters.guideName}
                        onChange={(e) =>
                          updateFilter("guideName", e.target.value)
                        }
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {popularGuides.map((guide) => (
                          <div
                            key={guide}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                            onClick={() => {
                              updateFilter("guideName", guide);
                              setShowDropdowns((prev) => ({
                                ...prev,
                                destinations: false,
                              }));
                            }}
                          >
                            {guide}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="flex-1 border-r border-gray-300 px-8 relative">
                <SimpleDatePicker
                  selectedDate={filters.date}
                  onChange={(date) => updateFilter("date", date)}
                />
              </div>

              {/* Travelers */}
              <div className="flex-1 pl-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FaUsers className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-normal text-gray-800">
                      Travelers
                    </h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          updateFilter(
                            "travelers",
                            Math.max(1, filters.travelers - 1),
                          )
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm text-gray-600">
                        {filters.travelers}
                      </span>
                      <button
                        onClick={() =>
                          updateFilter("travelers", filters.travelers + 1)
                        }
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <section className="flex flex-col lg:flex-row gap-4 mb-8 mt-6">
          {/* Search Bar with Auto-suggestions */}
          <div className="flex-1 bg-[#D9D9D9] rounded-2xl p-4 relative">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Search Input with Suggestions */}
              <div className="flex-1 w-full relative" ref={searchInputRef}>
                <div className="flex items-center gap-4">
                  <FaSearch className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Guides"
                    className="flex-1 bg-transparent border-none outline-none text-gray-600 text-lg placeholder-gray-500 w-full min-w-0"
                    value={filters.guideName}
                    onChange={(e) => {
                      updateFilter("guideName", e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                        setShowSuggestions(false);
                      }
                      if (e.key === "Escape") {
                        setShowSuggestions(false);
                      }
                    }}
                  />
                </div>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && filters.guideName.length > 0 && (
                  <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-full">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 font-medium px-3 py-2">
                        Suggestions for "{filters.guideName}"
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            updateFilter("guideName", suggestion);
                            handleSearch();
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 cursor-pointer rounded text-sm text-gray-700 flex items-center gap-2"
                        >
                          <FaSearch className="w-3 h-3 text-gray-400" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Filter Button */}
              <div className="hidden sm:flex items-center gap-4 ml-4">
                <button
                  onClick={(e) => toggleDropdown("filters", e)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors"
                >
                  <FaFilter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {/* Filters Dropdown for Desktop */}
            {showDropdowns.filters && (
              <div className="absolute mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">
                    Filters
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-600 hover:text-red-800 px-3 py-1"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdowns((prev) => ({
                          ...prev,
                          filters: false,
                        }));
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Region Filter */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Region</h4>
                    <div className="flex flex-wrap gap-2">
                      {regions
                        .filter((region) => region !== "Select Region")
                        .map((region) => (
                          <button
                            key={region}
                            onClick={() => updateFilter("region", region)}
                            className={`px-3 py-2 rounded-full transition-colors text-sm ${
                              filters.region === region
                                ? "bg-[#008A1E] text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {region}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Specialty Filter */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Specialty</h4>
                    <div className="flex flex-wrap gap-2">
                      {specialties.map((specialty) => (
                        <button
                          key={specialty}
                          onClick={() => updateFilter("specialty", specialty)}
                          className={`px-3 py-2 rounded-full transition-colors text-sm ${
                            filters.specialty === specialty
                              ? "bg-[#008A1E] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {specialty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Max Price Per Day</h4>
                    <div className="flex flex-wrap gap-2">
                      {[1000, 2000, 3000, 4000, 5000].map((price) => (
                        <button
                          key={price}
                          onClick={() => updateFilter("maxPrice", price)}
                          className={`px-3 py-2 rounded-full transition-colors text-sm ${
                            filters.maxPrice === price
                              ? "bg-[#008A1E] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {price} PKR
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Rating</h4>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => updateFilter("rating", rating)}
                          className={`px-3 py-2 rounded-full flex items-center gap-2 text-sm ${
                            filters.rating === rating
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <FaStar
                            className={`w-4 h-4 ${
                              filters.rating >= rating
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                          {rating}+
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Region Selector */}
          <div
            className="w-full lg:w-[280px] bg-white rounded-2xl p-4 flex items-center justify-between cursor-pointer relative"
            onClick={(e) => toggleDropdown("regions", e)}
          >
            <span className="text-gray-700 text-lg truncate pr-2">
              {filters.region}
            </span>
            <FaChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />

            {/* Regions Dropdown */}
            {showDropdowns.regions && (
              <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-full left-0 right-0 max-h-60 overflow-y-auto">
                {regions.map((region) => (
                  <div
                    key={region}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      updateFilter("region", region);
                      setShowDropdowns((prev) => ({
                        ...prev,
                        regions: false,
                      }));
                    }}
                  >
                    {region}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Active Filters */}
        {(filters.guideName ||
          filters.region !== "Select Region" ||
          filters.rating > 0 ||
          filters.maxPrice > 0 ||
          filters.specialty !== "Any") && (
          <div className="flex flex-wrap gap-3 mb-6">
            {filters.guideName && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-4 py-2 rounded-full flex items-center gap-2">
                <span>Guide: {filters.guideName}</span>
                <FaTimes
                  className="cursor-pointer hover:text-red-600 w-4 h-4"
                  onClick={() => updateFilter("guideName", "")}
                />
              </div>
            )}
            {filters.region !== "Select Region" && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-4 py-2 rounded-full flex items-center gap-2">
                <span>Region: {filters.region}</span>
                <FaTimes
                  className="cursor-pointer hover:text-red-600 w-4 h-4"
                  onClick={() => updateFilter("region", "Select Region")}
                />
              </div>
            )}
            {filters.maxPrice > 0 && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-4 py-2 rounded-full flex items-center gap-2">
                <span>Max Price: {filters.maxPrice} PKR</span>
                <FaTimes
                  className="cursor-pointer hover:text-red-600 w-4 h-4"
                  onClick={() => updateFilter("maxPrice", 0)}
                />
              </div>
            )}
            {filters.specialty !== "Any" && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-4 py-2 rounded-full flex items-center gap-2">
                <span>Specialty: {filters.specialty}</span>
                <FaTimes
                  className="cursor-pointer hover:text-red-600 w-4 h-4"
                  onClick={() => updateFilter("specialty", "Any")}
                />
              </div>
            )}
            {filters.rating > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full flex items-center gap-2">
                <span>Rating: {filters.rating}+ stars</span>
                <FaTimes
                  className="cursor-pointer hover:text-red-600 w-4 h-4"
                  onClick={() => updateFilter("rating", 0)}
                />
              </div>
            )}
            <button
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Clear Search Button */}
        {searchPerformed && (
          <div className="flex justify-center mb-8">
            <button
              onClick={clearAllFilters}
              className="px-6 py-2 bg-[#E6F4EA] text-[#008A1E] border border-[#008A1E] rounded-lg hover:bg-[#D6FFDF] transition-colors"
            >
              Clear Search & Show All Guides
            </button>
          </div>
        )}

        {/* Guides Grid */}
        <section className="py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {guidesToDisplay.map((guide) => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>

          {/* No Results */}
          {searchPerformed && guidesToDisplay.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaSearch className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-700 mb-2">
                No guides found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria
              </p>
              <button
                onClick={clearAllFilters}
                className="px-6 py-3 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors"
              >
                Show All Guides
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-[#BCF8FF] rounded-3xl p-2 my-2 min-h-[330px] flex items-center">
          <div className="text-center w-full">
            <h2 className="text-5xl font-bold text-gray-900 mb-8">
              Are you looking for
            </h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/Agency")}
                className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] transition-colors flex items-center gap-3 text-xl"
              >
                <span>Agency</span>
                <FaArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/Destination")}
                className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] transition-colors flex items-center gap-3 text-xl"
              >
                <span>Destination</span>
                <FaArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#008a1e] text-white pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">VoyageX</div>
              <p className="text-gray-200 mb-6 text-sm leading-relaxed">
                Lorem ipsum dolor sit amet consectetur. Tincidunt bibendum
                mauris ultricies eu lacus. Nulla tincidunt diam risus nullam
                euismod lore
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
                  ),
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
              <div className="flex items-center mt-6 text-gray-200">
                <MdOutlineMail className="w-5 h-5 mr-3" />
                <span className="text-sm">VoyageX@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GuidePage;