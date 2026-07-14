"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaSearch,
  FaChevronDown,
  FaStar,
  FaArrowRight,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";

import { packagesApi } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface Package {
  id: string;
  title: string;
  slug: string;
  image: string[];   // ← singular `image`, matches what PackageCard reads
  rating: number;
  price: number;
  capacity: string;
  duration: number;
  location: string;
  region: string;
  isPopular?: boolean;
  description: string;
  guide?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
  agency?: {
    name: string;
  };
}

interface SearchFilters {
  destination: string;
  region: string;
  priceRange: string;
  duration: string;
  rating: number;
  date: Date | null;
  travelers: number;
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
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
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
  popularDestinations,
  regions,
  priceRanges,
  durations,
  clearAllFilters,
  isSearching,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  updateFilter: (key: keyof SearchFilters, value: any) => void;
  handleSearch: () => void;
  popularDestinations: string[];
  regions: string[];
  priceRanges: string[];
  durations: string[];
  clearAllFilters: () => void;
  isSearching: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16">
      <div className="bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Search Packages</h3>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-3">
              <FaSearch className="w-5 h-5 text-gray-600" />
              <input
                type="text"
                placeholder="Search Package"
                className="flex-1 bg-transparent border-none outline-none text-gray-600 text-base"
                value={filters.destination}
                onChange={(e) => updateFilter("destination", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-2">Popular Searches</h4>
            <div className="flex flex-wrap gap-2">
              {popularDestinations.slice(0, 6).map((dest) => (
                <button
                  key={dest}
                  onClick={() => {
                    updateFilter("destination", dest);
                    handleSearch();
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {dest}
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
              <h4 className="font-medium text-gray-800 mb-3">Price Range</h4>
              <div className="flex flex-wrap gap-2">
                {priceRanges.map((range) => (
                  <button
                    key={range}
                    onClick={() => updateFilter("priceRange", range)}
                    className={`px-3 py-2 rounded-full transition-colors text-sm ${
                      filters.priceRange === range
                        ? "bg-[#008A1E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-800 mb-3">Duration</h4>
              <div className="flex flex-wrap gap-2">
                {durations.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => updateFilter("duration", duration)}
                    className={`px-3 py-2 rounded-full transition-colors text-sm ${
                      filters.duration === duration
                        ? "bg-[#008A1E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {duration}
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
              {isSearching ? "Searching..." : "Search Packages"}
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

const PackagesPage = () => {
  const router = useRouter();
  const initialSearch =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("search") || ""
      : "";

  // States
  const [filters, setFilters] = useState<SearchFilters>({
    destination: initialSearch,
    region: "Select Region",
    priceRange: "Any",
    duration: "Any",
    rating: 0,
    date: null,
    travelers: 1,
  });

  const [showDropdowns, setShowDropdowns] = useState({
    destinations: false,
    dates: false,
    regions: false,
    filters: false,
  });

  const [packages, setPackages] = useState<Package[]>([]);
  const [filteredPackages, setFilteredPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(!!initialSearch);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const popularDestinations = [
    "Hunza", "Swat", "Skardu", "Kalam", "Naran", "Murree", "Fairy Meadows", "Neelum Valley",
  ];

  const regions = [
    "Select Region", "Gilgit Baltistan", "Khyber Pakhtunkhwa", "Punjab", "Sindh",
    "Balochistan", "Azad Kashmir", "Islamabad",
  ];

  const priceRanges = [
    "Any", "Under 10,000", "10,000 - 20,000", "20,000 - 30,000", "30,000 - 40,000", "40,000+",
  ];

  const durations = ["Any", "1-3 Days", "4-7 Days", "8-14 Days", "15+ Days"];

  // Fetch packages — AbortController cancels stale request if component unmounts
  useEffect(() => {
    const controller = new AbortController();
    const fetchPackages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await packagesApi.getAll();
        if (controller.signal.aborted) return;
        const result = response.data;

        if (result.success && result.data) {
          const apiPackages = result.data.items || result.data || [];
          const mappedPackages: Package[] = apiPackages.map((pkg: any) => ({
            id: pkg.id,
            title: pkg.title,
            slug: pkg.slug,
            image: pkg.images || [],
            rating: pkg.rating || 0,
            price: pkg.price || 0,
            capacity: pkg.capacity || "N/A",
            duration: pkg.duration || 1,
            location: pkg.location || "",
            region: pkg.region || "",
            isPopular: pkg.isPopular || false,
            description: pkg.description || "",
            guide: pkg.guide,
            agency: pkg.agency,
          }));

          setPackages(mappedPackages);
          setFilteredPackages(mappedPackages);

          if (initialSearch) {
            const q = initialSearch.toLowerCase();
            setFilteredPackages(mappedPackages.filter((pkg: Package) =>
              pkg.title.toLowerCase().includes(q) ||
              pkg.location.toLowerCase().includes(q)
            ));
            setSearchPerformed(true);
          }
        } else {
          setError(result.message || "Failed to load packages");
        }
      } catch (err: any) {
        if (controller.signal.aborted) return;
        const message = err.response?.data?.message || err.message || "Failed to load packages. Please try again.";
        setError(message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchPackages();
    return () => controller.abort();
  }, [initialSearch]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={`w-4 h-4 ${
              index < Math.floor(rating)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDropdown = (
    dropdown: keyof typeof showDropdowns,
    e?: React.MouseEvent,
  ) => {
    if (e) e.stopPropagation();
    setShowDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const handleCardClick = (pkg: Package) => {
    router.push(`/packages/${pkg.slug}`);
  };

  const handleViewDetailsClick = (pkg: Package) => {
    router.push(`/packages/${pkg.slug}`);
  };

  const getAuthorName = (pkg: Package) => {
    if (pkg.guide?.user) {
      return `${pkg.guide.user.firstName} ${pkg.guide.user.lastName}`;
    }
    if (pkg.agency?.name) {
      return pkg.agency.name;
    }
    return "VoyageX";
  };

  const handleSearch = useCallback(() => {
    setSearchPerformed(true);
    setShowSuggestions(false);
    setIsSearching(true);

    let results = [...packages];

    if (filters.destination.trim()) {
      results = results.filter((pkg) =>
        pkg.title.toLowerCase().includes(filters.destination.toLowerCase()) ||
        pkg.location.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }

    if (filters.region !== "Select Region") {
      results = results.filter((pkg) => pkg.region === filters.region);
    }

    if (filters.rating > 0) {
      results = results.filter((pkg) => pkg.rating >= filters.rating);
    }

    if (filters.priceRange !== "Any") {
      switch (filters.priceRange) {
        case "Under 10,000":
          results = results.filter((pkg) => pkg.price < 10000);
          break;
        case "10,000 - 20,000":
          results = results.filter((pkg) => pkg.price >= 10000 && pkg.price <= 20000);
          break;
        case "20,000 - 30,000":
          results = results.filter((pkg) => pkg.price >= 20000 && pkg.price <= 30000);
          break;
        case "30,000 - 40,000":
          results = results.filter((pkg) => pkg.price >= 30000 && pkg.price <= 40000);
          break;
        case "40,000+":
          results = results.filter((pkg) => pkg.price > 40000);
          break;
      }
    }

    if (filters.duration !== "Any") {
      results = results.filter((pkg) => {
        switch (filters.duration) {
          case "1-3 Days":
            return pkg.duration >= 1 && pkg.duration <= 3;
          case "4-7 Days":
            return pkg.duration >= 4 && pkg.duration <= 7;
          case "8-14 Days":
            return pkg.duration >= 8 && pkg.duration <= 14;
          case "15+ Days":
            return pkg.duration >= 15;
          default:
            return true;
        }
      });
    }

    setFilteredPackages(results);
    setIsSearching(false);
  }, [filters, packages]);

  const clearAllFilters = () => {
    setFilters({
      destination: "",
      region: "Select Region",
      priceRange: "Any",
      duration: "Any",
      rating: 0,
      date: null,
      travelers: 1,
    });
    setFilteredPackages(packages);
    setSearchPerformed(false);
    setShowDropdowns({
      destinations: false,
      dates: false,
      regions: false,
      filters: false,
    });
    setShowSuggestions(false);
  };

  const generateSuggestions = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchSuggestions(popularDestinations.slice(0, 5));
      return;
    }
    const queryLower = query.toLowerCase();
    const filtered = popularDestinations
      .filter((dest) => dest.toLowerCase().includes(queryLower))
      .slice(0, 5);
    setSearchSuggestions(filtered.length ? filtered : [`Search for "${query}"`, ...popularDestinations.slice(0, 4)]);
  }, []);

  useEffect(() => {
    generateSuggestions(filters.destination);
  }, [filters.destination, generateSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const packagesToDisplay = searchPerformed ? filteredPackages : packages;

  const PackageCard = ({ pkg }: { pkg: Package }) => {
    const imageUrl = getImageUrl(pkg.image?.[0]);

    return (
      <div
        className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden group hover:scale-[1.02] transition-transform duration-300 cursor-pointer"
        onClick={() => handleCardClick(pkg)}
      >
        <div className="relative h-48 overflow-hidden">
          {/* Use <img> (not Next.js <Image>) to bypass remotePattern validation
              and match the same approach used on the package detail page */}
          <img
            src={imageUrl}
            alt={pkg.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/agency-placeholder.jpg";
            }}
          />

          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {pkg.isPopular && (
              <div className="bg-[#008A1E] text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                Popular
              </div>
            )}
          </div>

          <div className="absolute bottom-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              {pkg.region}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-[#008A1E] transition-colors">
              {pkg.title}
            </h3>
            {renderStars(pkg.rating)}
          </div>

          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {getAuthorName(pkg)}
          </p>

          <div className="space-y-2 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm text-gray-500">
              <span>From</span>
              <span>Available</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">{pkg.price.toLocaleString()} Rs</span>
              <span className="text-[#008A1E] font-semibold">{pkg.duration} Days</span>
            </div>
            <div className="text-sm text-gray-600">Capacity: {pkg.capacity}</div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetailsClick(pkg);
            }}
            className="w-full h-[31px] bg-[#008A1E] text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-300 mt-4"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <div className="h-6 bg-gray-200 rounded w-16" />
                    <div className="h-6 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7] font-sans">
      <MobileSearchModal
        isOpen={showMobileSearch}
        onClose={() => setShowMobileSearch(false)}
        filters={filters}
        updateFilter={updateFilter}
        handleSearch={handleSearch}
        popularDestinations={popularDestinations}
        regions={regions}
        priceRanges={priceRanges}
        durations={durations}
        clearAllFilters={clearAllFilters}
        isSearching={isSearching}
      />

      <div className="relative">
        <Navbar />
        <div className="lg:hidden absolute top-4 right-4 z-20">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="w-10 h-10 bg-[#008A1E] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#006816] transition-colors"
            aria-label="Search"
          >
            <FaSearch className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-[url('/Home.png')] bg-cover bg-no-repeat bg-center">
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 flex justify-center px-4 mb-20">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[809px] p-6 lg:p-8 mx-auto z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4">
              <div className="flex-1 lg:flex-none lg:w-1/3 lg:border-r lg:border-gray-300 lg:pr-8 relative">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={(e) => toggleDropdown("destinations", e)}
                >
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FaMapMarkerAlt className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-normal text-gray-800">Destinations</h3>
                    <p className="text-sm text-gray-600">{filters.destination || "Where to ?"}</p>
                  </div>
                  <FaChevronDown className="w-4 h-4 text-gray-500" />
                </div>

                {showDropdowns.destinations && (
                  <div className="absolute mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-64">
                    <div className="p-3">
                      <input
                        type="text"
                        placeholder="Search destination..."
                        className="w-full p-2 mb-2 border border-gray-300 rounded text-sm"
                        value={filters.destination}
                        onChange={(e) => updateFilter("destination", e.target.value)}
                      />
                      <div className="max-h-60 overflow-y-auto">
                        {popularDestinations.map((dest) => (
                          <div
                            key={dest}
                            className="p-2 hover:bg-gray-100 cursor-pointer rounded text-sm"
                            onClick={() => {
                              updateFilter("destination", dest);
                              setShowDropdowns((prev) => ({ ...prev, destinations: false }));
                            }}
                          >
                            {dest}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 lg:flex-none lg:w-1/3 lg:border-r lg:border-gray-300 lg:px-8 relative">
                <SimpleDatePicker
                  selectedDate={filters.date}
                  onChange={(date) => updateFilter("date", date)}
                />
              </div>

              <div className="flex-1 lg:flex-none lg:w-1/3 lg:pl-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <FaUsers className="w-5 h-5 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-normal text-gray-800">Travelers</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateFilter("travelers", Math.max(1, filters.travelers - 1))}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-sm text-gray-600">{filters.travelers}</span>
                      <button
                        onClick={() => updateFilter("travelers", filters.travelers + 1)}
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

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Search and Filter Section */}
        <section className="flex flex-col lg:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex-1 bg-[#D9D9D9] rounded-xl sm:rounded-2xl px-3 sm:px-6 py-4 relative">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full relative" ref={searchInputRef}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <FaSearch className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Package"
                    className="flex-1 bg-transparent border-none outline-none text-gray-600 text-sm sm:text-base lg:text-lg placeholder-gray-500 w-full min-w-0"
                    value={filters.destination}
                    onChange={(e) => {
                      updateFilter("destination", e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                      if (e.key === "Escape") setShowSuggestions(false);
                    }}
                  />
                </div>

                {showSuggestions && filters.destination.length > 0 && (
                  <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-full">
                    <div className="p-2">
                      <div className="text-xs text-gray-500 font-medium px-3 py-2">
                        Suggestions for "{filters.destination}"
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            updateFilter("destination", suggestion);
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

              <div className="hidden sm:flex items-center gap-4 ml-0 sm:ml-4">
                <button
                  onClick={(e) => toggleDropdown("filters", e)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors"
                >
                  <FaFilter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {showDropdowns.filters && (
              <div className="absolute mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 sm:p-6 w-full max-w-md sm:max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">Filters</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-800 px-3 py-1">Clear All</button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDropdowns((prev) => ({ ...prev, filters: false }));
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Price Range</h4>
                    <div className="flex flex-wrap gap-2">
                      {priceRanges.map((range) => (
                        <button
                          key={range}
                          onClick={() => updateFilter("priceRange", range)}
                          className={`px-3 py-2 rounded-full transition-colors text-xs sm:text-sm ${
                            filters.priceRange === range ? "bg-[#008A1E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Duration</h4>
                    <div className="flex flex-wrap gap-2">
                      {durations.map((duration) => (
                        <button
                          key={duration}
                          onClick={() => updateFilter("duration", duration)}
                          className={`px-3 py-2 rounded-full transition-colors text-xs sm:text-sm ${
                            filters.duration === duration ? "bg-[#008A1E] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Rating</h4>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => updateFilter("rating", rating)}
                          className={`px-3 py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm ${
                            filters.rating === rating ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <FaStar className={`w-3 h-3 sm:w-4 sm:h-4 ${filters.rating >= rating ? "text-yellow-500" : "text-gray-300"}`} />
                          {rating}+
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="lg:w-[280px] bg-white rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between cursor-pointer relative min-h-[56px] sm:min-h-[64px]"
            onClick={(e) => toggleDropdown("regions", e)}
          >
            <span className="text-gray-700 text-sm sm:text-base lg:text-lg truncate pr-2">{filters.region}</span>
            <FaChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />

            {showDropdowns.regions && (
              <div className="absolute top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-full left-0 right-0">
                {regions.map((region) => (
                  <div
                    key={region}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm sm:text-base"
                    onClick={() => {
                      updateFilter("region", region);
                      setShowDropdowns((prev) => ({ ...prev, regions: false }));
                    }}
                  >
                    {region}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {(filters.destination || filters.region !== "Select Region" || filters.rating > 0 || filters.priceRange !== "Any" || filters.duration !== "Any") && (
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
            {filters.destination && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm">
                <span>Destination: {filters.destination}</span>
                <FaTimes className="cursor-pointer hover:text-red-600 w-3 h-3 sm:w-4 sm:h-4" onClick={() => updateFilter("destination", "")} />
              </div>
            )}
            {filters.region !== "Select Region" && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm">
                <span>Region: {filters.region}</span>
                <FaTimes className="cursor-pointer hover:text-red-600 w-3 h-3 sm:w-4 sm:h-4" onClick={() => updateFilter("region", "Select Region")} />
              </div>
            )}
            {filters.priceRange !== "Any" && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm">
                <span>Price: {filters.priceRange}</span>
                <FaTimes className="cursor-pointer hover:text-red-600 w-3 h-3 sm:w-4 sm:h-4" onClick={() => updateFilter("priceRange", "Any")} />
              </div>
            )}
            {filters.duration !== "Any" && (
              <div className="bg-[#E6F4EA] text-[#008A1E] px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm">
                <span>Duration: {filters.duration}</span>
                <FaTimes className="cursor-pointer hover:text-red-600 w-3 h-3 sm:w-4 sm:h-4" onClick={() => updateFilter("duration", "Any")} />
              </div>
            )}
            {filters.rating > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-2 text-xs sm:text-sm">
                <span>Rating: {filters.rating}+ stars</span>
                <FaTimes className="cursor-pointer hover:text-red-600 w-3 h-3 sm:w-4 sm:h-4" onClick={() => updateFilter("rating", 0)} />
              </div>
            )}
            <button onClick={clearAllFilters} className="text-red-600 hover:text-red-800 text-xs sm:text-sm font-medium">Clear All</button>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#008A1E] text-white rounded-lg">Try Again</button>
          </div>
        )}

        {!error && (
          <section className="py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {packagesToDisplay.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>

            {packagesToDisplay.length === 0 && !isLoading && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">No packages found</h3>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Try adjusting your search criteria</p>
                <button onClick={clearAllFilters} className="px-4 sm:px-6 py-2 sm:py-3 bg-[#008A1E] text-white rounded-lg hover:bg-[#006816] transition-colors text-sm sm:text-base">
                  Show All Packages
                </button>
              </div>
            )}
          </section>
        )}

        <section className="bg-[#BCF8FF] rounded-3xl p-2 my-2 min-h-[330px] flex items-center">
          <div className="text-center w-full">
            <h2 className="text-5xl font-bold text-gray-900 mb-8">Are you looking for</h2>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/guide")}
                className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] transition-colors flex items-center gap-3 text-xl"
              >
                <span>Guide</span>
                <FaArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/agency")}
                className="px-8 py-4 bg-[#008A1E] text-white rounded-2xl hover:bg-[#006816] transition-colors flex items-center gap-3 text-xl"
              >
                <span>Agency</span>
                <FaArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div> 
  );
};

export default PackagesPage;