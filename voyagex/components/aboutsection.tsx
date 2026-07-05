"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Users,
  Settings,
  Shield,
  BadgeCheck,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { guidesApi, packagesApi } from "../lib/api";

const AboutSection = () => {
  const router = useRouter();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState({
    travelers: 12500,
    guides: 0,
    destinations: 8,
    tours: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [packagesRes, guidesRes] = await Promise.all([
          packagesApi.getAll({ limit: 1 }),
          guidesApi.getAll({ limit: 1 }),
        ]);

        const packagesResult = packagesRes.data;
        const guidesResult = guidesRes.data;

        setStats({
          travelers: 12500,
          guides: guidesResult.success && guidesResult.data
            ? (guidesResult.data.pagination?.total || guidesResult.data.items?.length || 0)
            : 0,
          destinations: 8,
          tours: packagesResult.success && packagesResult.data
            ? (packagesResult.data.pagination?.total || packagesResult.data.items?.length || 0)
            : 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };
    fetchStats();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="About" ref={sectionRef}>
      <div className="flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 mt-[100px] overflow-hidden">
        <div
          className={`transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <h1 className="font-bold text-[36px] sm:text-[40px] md:text-[44px] lg:text-[48px] text-center">
            Why Choose Us?
          </h1>
          <p className="font-medium text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] mt-2 text-center">
            Your safety, comfort, and experience are our top priority
          </p>
        </div>

        <button
          onClick={() => router.push("/")}
          className={`mt-6 w-full max-w-[320px] h-[62px] rounded-[16px] bg-[#008A1E] text-white hover:bg-green-700 transition-all duration-500 flex items-center justify-center gap-2 px-8 group transform ${isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
        >
          <span className="font-medium text-[18px] sm:text-[20px]">
            Discover More About Us
          </span>
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="flex flex-col lg:flex-row justify-center items-start gap-6 mt-8 w-full max-w-[1536px] mx-auto">
          <div
            className={`flex flex-col w-full lg:w-auto lg:flex-1 transform transition-all duration-700 delay-100 ${isVisible ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"}`}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="bg-white flex flex-col items-center w-full md:w-[360px] h-[398px] shadow-lg rounded-[24px] p-6 hover:shadow-xl hover:-translate-y-1 transition">
                <div className="flex items-start gap-3 w-full">
                  <Check className="w-10 h-10 text-green-600 mt-5" />
                  <h2 className="font-semibold text-[24px] md:text-[28px] lg:text-[32px] leading-tight mt-5">
                    Authentic Local Experiences
                  </h2>
                </div>
                <p className="font-normal text-[16px] lg:text-[18px] leading-relaxed mt-4 text-gray-700">
                  Discover hidden trails, secret cafes, and cultural gems only
                  locals know.
                </p>
              </div>
              <div className="bg-white flex flex-col items-center w-full md:w-[360px] h-[398px] shadow-lg rounded-[24px] p-6 hover:shadow-xl hover:-translate-y-1 transition">
                <div className="flex items-start gap-3 w-full">
                  <Shield className="w-12 h-12 text-green-600 mt-4" />
                  <h2 className="font-semibold text-[24px] md:text-[28px] lg:text-[32px] leading-tight mt-4">
                    Verified and Trusted Guides
                  </h2>
                </div>
                <p className="font-normal text-[16px] lg:text-[18px] leading-relaxed mt-4 text-gray-700">
                  Every guide undergoes thorough background checks and
                  government verification.
                </p>
              </div>
            </div>
            <div className="bg-white flex flex-col items-start w-full md:w-[750px] h-auto min-h-[204px] shadow-lg rounded-[24px] p-6 mt-6 hover:shadow-xl hover:-translate-y-1 transition">
              <div className="flex items-start gap-3">
                <Users className="w-12 h-12 text-green-600" />
                <h2 className="font-semibold text-[24px] md:text-[28px] lg:text-[32px] leading-tight">
                  Support Local Communities
                </h2>
              </div>
              <p className="font-normal text-[16px] lg:text-[18px] leading-relaxed mt-4 text-gray-700">
                85% of your payment goes directly to local guides and their
                communities. Travel responsibly while empowering Pakistani
                entrepreneurs.
              </p>
            </div>
          </div>

          <div
            className={`bg-white w-full lg:w-[470px] h-auto min-h-[626px] shadow-lg rounded-[24px] p-6 flex flex-col justify-between transform transition-all duration-700 delay-200 hover:shadow-xl hover:-translate-y-1 ${isVisible ? "translate-x-0 opacity-100" : "translate-x-10 opacity-0"}`}
          >
            <div className="mb-6 md:mb-8">
              <div className="flex items-start gap-3">
                <Settings className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
                <h2 className="font-semibold text-[20px] md:text-[24px] lg:text-[28px] leading-tight">
                  Customizable Itineraries
                </h2>
              </div>
              <p className="text-gray-700 mt-3">
                Your trip, your rules. Chat directly with local guides to build
                a plan that fits your pace, interests, and budget.
              </p>
            </div>
            <div className="mb-6 md:mb-8">
              <div className="flex items-start gap-3">
                <BadgeCheck className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
                <h2 className="font-semibold text-[20px] md:text-[24px] lg:text-[28px] leading-tight">
                  Verified Providers
                </h2>
              </div>
              <p className="text-gray-700 mt-3">
                Every guide and agency undergoes strict background checks and
                government verification before joining us.
              </p>
            </div>
            <div>
              <div className="flex items-start gap-3">
                <Wallet className="w-10 h-10 md:w-12 md:h-12 text-green-600" />
                <h2 className="font-semibold text-[20px] md:text-[24px] lg:text-[28px] leading-tight">
                  Transparent Pricing
                </h2>
              </div>
              <p className="text-gray-700 mt-3">
                Say goodbye to hidden fees. The price you see is the price you
                pay, with no haggling required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;