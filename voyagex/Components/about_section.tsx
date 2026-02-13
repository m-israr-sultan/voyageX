'use client';

import { Check, Users, Settings, Shield, BadgeCheck, Wallet, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const AboutSection = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section className="About" ref={sectionRef}>
      <div className="
        flex flex-col items-center
        w-full
        px-4
        sm:px-6
        lg:px-8
        xl:px-10
        2xl:px-12
        mt-[100px]
        overflow-hidden
      ">
        {/* Header with fade-in animation */}
        <div className={`
          transform transition-all duration-1000
          ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        `}>
          <h1 className="
            font-bold
            text-[36px]
            sm:text-[40px]
            md:text-[44px]
            lg:text-[48px]
            text-center
          ">
            Why Choose Us?
          </h1>
          <p className="
            font-medium
            text-[18px]
            sm:text-[20px]
            md:text-[22px]
            lg:text-[24px]
            mt-2
            text-center
          ">
            Your safety, comfort, and experience are our top priority
          </p>
        </div>
        
        {/* Discover More Button with scale animation */}
        <button className={`
          mt-6
          w-full
          max-w-[320px]
          h-[62px]
          rounded-[16px]
          bg-[#008A1E]
          text-white
          hover:bg-green-700
          transition-all duration-500
          flex flex-row items-center justify-center
          gap-2
          px-8
          group
          transform
          ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
        `}>
          <span className="font-medium text-[18px] sm:text-[20px]">
            Discover More About Us
          </span>
          <ArrowRight 
            className="
              w-5 h-5
              sm:w-6 sm:h-6
              transition-transform duration-300 
              group-hover:translate-x-1
            "
          />
        </button>

        {/* About Cards Container with staggered animations */}
        <div className="
          flex
          flex-col
          lg:flex-row
          justify-center
          items-start
          gap-6
          mt-8
          w-full
          max-w-[1536px]
          mx-auto
        ">
          {/* Left Column */}
          <div className={`
            flex flex-col w-full lg:w-auto lg:flex-1
            transform transition-all duration-700 delay-100
            ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}
          `}>
            {/* Top Row - Two Cards */}
            <div className="
              flex
              flex-col
              md:flex-row
              gap-6
            ">
              {/* Authentic Local Experiences Card with hover animation */}
              <div className="
                bg-white
                flex flex-col
                items-center
                w-full
                md:w-[360px]
                h-[398px]
                shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
                rounded-[24px]
                p-6
                transition-all duration-500
                hover:shadow-xl
                hover:-translate-y-1
                transform
              ">
                <div className="flex flex-row items-start gap-3 w-full">
                  <Check className="w-10 h-10 text-green-600 mt-5 transition-transform duration-500 hover:scale-110" />
                  <h2 className="
                    font-semibold
                    text-[24px]
                    md:text-[28px]
                    lg:text-[32px]
                    leading-tight
                    mt-5
                  ">
                    Authentic Local Experiences
                  </h2>
                </div>
                <p className="
                  font-normal
                  text-[16px]
                  lg:text-[18px]
                  leading-relaxed
                  mt-4
                  w-full
                  text-gray-700
                ">
                  Discover hidden trails, secret cafes, and cultural gems only locals know. Move beyond tourist spots to experience the true soul of Pakistan through the eyes of those who call it home.
                </p>
              </div>

              {/* Verified and Trusted Guides Card with hover animation */}
              <div className="
                bg-white
                flex flex-col
                items-center
                w-full
                md:w-[360px]
                h-[398px]
                shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
                rounded-[24px]
                p-6
                transition-all duration-500 delay-75
                hover:shadow-xl
                hover:-translate-y-1
                transform
              ">
                <div className="flex flex-row items-start gap-3 w-full">
                  <Shield className="w-12 h-12 text-green-600 mt-4 transition-transform duration-500 hover:scale-110" />
                  <h2 className="
                    font-semibold
                    text-[24px]
                    md:text-[28px]
                    lg:text-[32px]
                    leading-tight
                    mt-4
                  ">
                    Verified and Trusted Guides
                  </h2>
                </div>
                <p className="
                  font-normal
                  text-[16px]
                  lg:text-[18px]
                  leading-relaxed
                  mt-4
                  w-full
                  text-gray-700
                ">
                  Every guide undergoes thorough background checks, training, and community reviews, and government verification before joining us. Your safety and enjoyment are our top priority—adventure with complete peace of mind.
                </p>
              </div>
            </div>

            {/* Support Local Communities Card with hover animation */}
            <div className="
              bg-white
              flex flex-col
              items-start
              w-full
              md:w-[750px]
              h-auto
              min-h-[204px]
              shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
              rounded-[24px]
              p-6
              mt-6
              transition-all duration-500 delay-150
              hover:shadow-xl
              hover:-translate-y-1
              transform
            ">
              <div className="flex flex-row items-start gap-3">
                <Users className="w-12 h-12 text-green-600 transition-transform duration-500 hover:scale-110" />
                <h2 className="
                  font-semibold
                  text-[24px]
                  md:text-[28px]
                  lg:text-[32px]
                  leading-tight
                ">
                  Support Local Communities
                </h2>
              </div>
              <p className="
                font-normal
                text-[16px]
                lg:text-[18px]
                leading-relaxed
                mt-4
                w-full
                text-gray-700
              ">
                85% of your payment goes directly to local guides and their communities. Travel responsibly while empowering Pakistani entrepreneurs and preserving cultural heritage.
              </p>
            </div>
          </div>

          {/* Right Column - Single Card with 3 sections - slide in from right */}
          <div className={`
            bg-white
            w-full
            lg:w-[470px]
            h-auto
            min-h-[626px]
            shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
            rounded-[24px]
            p-6
            lg:mt-0
            flex flex-col
            justify-between
            transform transition-all duration-700 delay-200
            hover:shadow-xl
            hover:-translate-y-1
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
          `}>
            {/* Customizable Itineraries */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-row items-start gap-3">
                <Settings className="w-10 h-10 md:w-12 md:h-12 text-green-600 flex-shrink-0 transition-transform duration-500 hover:scale-110" />
                <h2 className="
                  font-semibold
                  text-[20px]
                  md:text-[24px]
                  lg:text-[28px]
                  leading-tight
                ">
                  Customizable Itineraries
                </h2>
              </div>
              <p className="
                font-normal
                text-[14px]
                md:text-[16px]
                leading-relaxed
                mt-3
                text-gray-700
              ">
                Your trip, your rules. Don't like rigid schedules? Chat directly with local guides to build a plan that fits your pace, interests, and budget—whether it's a food tour or a K2 trek.
              </p>
            </div>

            {/* Verified Providers */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-row items-start gap-3">
                <BadgeCheck className="w-10 h-10 md:w-12 md:h-12 text-green-600 flex-shrink-0 transition-transform duration-500 hover:scale-110" />
                <h2 className="
                  font-semibold
                  text-[20px]
                  md:text-[24px]
                  lg:text-[28px]
                  leading-tight
                ">
                  Verified Providers
                </h2>
              </div>
              <p className="
                font-normal
                text-[14px]
                md:text-[16px]
                leading-relaxed
                mt-3
                text-gray-700
              ">
                We don't just list anyone. Every guide and agency undergoes strict background checks and government verification before joining us.
              </p>
            </div>

            {/* Transparent Pricing */}
            <div>
              <div className="flex flex-row items-start gap-3">
                <Wallet className="w-10 h-10 md:w-12 md:h-12 text-green-600 flex-shrink-0 transition-transform duration-500 hover:scale-110" />
                <h2 className="
                  font-semibold
                  text-[20px]
                  md:text-[24px]
                  lg:text-[28px]
                  leading-tight
                ">
                  Transparent Pricing
                </h2>
              </div>
              <p className="
                font-normal
                text-[14px]
                md:text-[16px]
                leading-relaxed
                mt-3
                text-gray-700
              ">
                Say goodbye to hidden fees and "tourist taxes." The price you see is the price you pay. We ensure fair, standard rates for both locals and foreigners, with no haggling required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;