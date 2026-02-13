'use client';

import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import Navbar from './navbar';

const Hero = () => {
  return (
    <div className="relative">
      {/* Hero Background Section - FULL WIDTH */}
      <div 
        className="
          /* Background Image */
          bg-[url('/Home.png')]
          bg-no-repeat bg-cover bg-center
          
          /* Dimensions */
          w-full h-screen min-h-[720px] max-h-[900px]
          
          /* Flex Layout */
          flex flex-col
          
          /* Positioning */
          relative
        "
      >
        {/* Navbar - FULL WIDTH */}
        <div className="w-full bg-white">
          <Navbar />
        </div>
        
        {/* Centered Hero Content WITH PADDING */}
        <div className="
          flex-1
          flex items-center justify-center
          w-full
          px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12
        ">
          <div 
            className="
              text-center
              w-full max-w-[1536px]
              mx-auto
            "
          >
            <h1 
              className="
                text-[32px] leading-tight
                sm:text-[36px]
                md:text-[40px]
                lg:text-[44px]
                xl:text-[48px]
                2xl:text-[56px]
                font-bold
                text-white
                mb-6
                sm:mb-8
                lg:mb-10
              "
            >
              Explore The Hidden Gems of Pakistan
            </h1>
            
            <Link 
              href="/Destination"
              className="
                group
                inline-flex flex-row justify-center items-center
                bg-[#008A1E]
                w-[140px] h-[48px]
                sm:w-[160px] sm:h-[54px]
                md:w-[180px] md:h-[58px]
                lg:w-[192px] lg:h-[62px]
                xl:w-[210px] xl:h-[66px]
                2xl:w-[230px] 2xl:h-[70px]
                px-4 py-2
                rounded-[16px]
                gap-2
                text-white 
                text-[20px]
                sm:text-[22px]
                md:text-[24px]
                lg:text-[26px]
                xl:text-[28px]
                2xl:text-[30px]
                font-medium
                hover:bg-green-700
                transition-all duration-300
                hover:scale-105
                active:scale-95
              "
            >
              <span className="transition-transform duration-300 group-hover:translate-x-[-4px]">
                Explore
              </span>
              <ArrowRight 
                size={20}
                className="
                  transition-transform duration-300 
                  group-hover:translate-x-[4px]
                  sm:size-6
                  md:size-7
                  lg:size-8
                  xl:size-9
                  2xl:size-10
                "
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div className="
        /* Positioning - BELOW Hero, ABOVE Explore */
        absolute
        bottom-0
        left-1/2
        transform -translate-x-1/2 translate-y-1/2
        w-full
        flex justify-center
        px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12
        z-50
      ">
        <div className="
          flex flex-row items-center
          bg-[#E6F4EA]
          rounded-[24px]
          sm:rounded-[28px]
          lg:rounded-[32px]
          xl:rounded-[36px]
          px-[20px]
          sm:px-[24px]
          lg:px-[28px]
          xl:px-[32px]
          2xl:px-[36px]
          shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
          gap-3
          sm:gap-4
          w-full 
          max-w-[320px]
          sm:max-w-[360px]
          md:max-w-[400px]
          lg:max-w-[450px]
          xl:max-w-[500px]
          2xl:max-w-[550px]
          h-[60px]
          sm:h-[65px]
          md:h-[70px]
          lg:h-[75px]
          xl:h-[80px]
          2xl:h-[85px]
        ">
          <Search 
            className="
              text-gray-600
              w-5 h-5
              sm:w-6 sm:h-6
              md:w-7 md:h-7
              lg:w-8 lg:h-8
              xl:w-9 xl:h-9
              2xl:w-10 2xl:h-10
            "
          />
          
          <input
            type="text"
            placeholder="Where To Go?"
            className="
              w-full
              bg-transparent
              border-none
              focus:outline-none
              placeholder-gray-500
              font-medium
              text-[13px]
              sm:text-[14px]
              md:text-[15px]
              lg:text-[16px]
              xl:text-[18px]
              2xl:text-[20px]
            "
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;  