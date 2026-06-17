"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import Navbar from "./navbar";

const Hero = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const popularDestinations = [
    "Hunza",
    "Skardu",
    "Swat",
    "Kalam",
    "Naran",
    "Murree",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      router.push("/destination");
      return;
    }

    const query = encodeURIComponent(searchQuery.trim());

    // Route to all three listing pages via query params
    // The main redirect is to Packages which has search built in
    // Users can also navigate to Guides/Agencies from there
    router.push(`/packages?search=${query}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      const filtered = popularDestinations.filter((d) =>
        d.toLowerCase().includes(value.toLowerCase()),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="bg-[url('/Home.png')] bg-no-repeat bg-cover bg-center w-full h-screen min-h-[720px] max-h-[900px] flex flex-col relative">
        <div className="w-full bg-white">
          <Navbar />
        </div>
        <div className="flex-1 flex items-center justify-center w-full px-4">
          <div className="text-center w-full max-w-[1536px] mx-auto">
            <h1 className="text-[32px] sm:text-[36px] md:text-[40px] lg:text-[44px] xl:text-[48px] 2xl:text-[56px] font-bold text-white mb-4 sm:mb-5 md:mb-6">
              Explore the Hidden Gems of Pakistan
            </h1>
            <p className="text-white text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto px-4 opacity-90 mb-8 sm:mb-10 lg:mb-12">
              Book verified local guides, authentic travel experiences, and trusted tour agencies across Northern Pakistan — all in one marketplace.
            </p>
            <Link
              href="/destination"
              className="group inline-flex justify-center items-center bg-[#008A1E] w-[140px] sm:w-[160px] md:w-[180px] lg:w-[192px] xl:w-[210px] 2xl:w-[230px] h-[48px] sm:h-[54px] md:h-[58px] lg:h-[62px] xl:h-[66px] 2xl:h-[70px] rounded-[16px] gap-2 text-white text-[20px] sm:text-[22px] md:text-[24px] lg:text-[26px] xl:text-[28px] 2xl:text-[30px] font-medium hover:bg-green-700 transition-all hover:scale-105"
            >
              <span className="transition-transform group-hover:translate-x-[-4px]">
                Explore
              </span>
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-[4px]"
              />
            </Link>
          </div>
        </div>
        {/* WhatsApp floating button removed — all bookings go through VoyageX platform */}
      </div>

      <form
        onSubmit={handleSearch}
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-full flex justify-center px-4 z-50"
      >
        <div className="flex flex-row items-center bg-[#E6F4EA] rounded-[24px] px-[20px] shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)] gap-3 w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px] lg:max-w-[450px] xl:max-w-[500px] 2xl:max-w-[550px] h-[60px] sm:h-[65px] md:h-[70px] lg:h-[75px] xl:h-[80px] 2xl:h-[85px] relative">
          <button type="submit" className="cursor-pointer">
            <Search className="text-gray-600 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9 2xl:w-10 2xl:h-10" />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
            placeholder="Search guides, agencies, destinations..."
            className="w-full bg-transparent focus:outline-none placeholder-gray-500 font-medium text-[13px] sm:text-[14px] md:text-[15px] lg:text-[16px] xl:text-[18px] 2xl:text-[20px]"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border z-50">
              <div className="p-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSearchQuery(s);
                      setShowSuggestions(false);
                      router.push(`/packages?search=${encodeURIComponent(s)}`);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-gray-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Hero;