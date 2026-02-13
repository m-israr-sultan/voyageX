'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, CheckCircle } from 'lucide-react';

const AgenciesSection = () => {
  const router = useRouter(); // Add this line

  const agencies = [
    {
      id: 1,
      name: 'Trust & Tour',
      location: 'F11, Islamabad',
      image: '/agency1.jpg',
      status: 'NOC Verified',
      successTours: '10+',
    },
    {
      id: 2,
      name: 'Trust & Tour',
      location: 'F11, Islamabad',
      image: '/agency2.jpg',
      status: 'NOC Verified',
      successTours: '10+',
    },
    {
      id: 3,
      name: 'Trust & Tour',
      location: 'F11, Islamabad',
      image: '/agency3.jpg',
      status: 'NOC Verified',
      successTours: '10+',
    },
    {
      id: 4,
      name: 'Trust & Tour',
      location: 'F11, Islamabad',
      image: '/agency4.jpg',
      status: 'NOC Verified',
      successTours: '10+',
    },
  ];

  const renderStars = () => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <span 
            key={index} 
            className="text-lg text-yellow-500"
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className="
      mt-[90px]
      flex flex-col
      w-full
      px-4
      sm:px-6
      lg:px-8
      xl:px-10
      2xl:px-12
    ">
      {/* Header Section */}
      <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Agencies</h1>
        
        <button 
          onClick={() => router.push('/Agency')}
          className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
        >
          <span>See More</span>
          <ArrowRight size={20} className="w-5 h-5" />
        </button>
      </div>

      {/* Cards Container */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-4
        sm:gap-5
        lg:gap-6
        xl:gap-6
        2xl:gap-8
        mt-6
        w-full
        max-w-[1536px]
        mx-auto
      ">
        {agencies.map((agency) => (
          <div 
            key={agency.id}
            className="
              h-[420px]
              bg-white
              rounded-lg
              shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
              hover:shadow-2xl
              transition-all duration-300
              hover:scale-[1.02]
              flex flex-col
              p-2
              sm:p-3
              lg:p-4
            "
          >
            {/* Image Container */}
            <div className="
              w-full
              h-[180px]
              sm:h-[190px]
              lg:h-[200px]
              xl:h-[210px]
              rounded-lg
              overflow-hidden
              relative
              hover:scale-[1.1]
              duration-300
            ">
              <Image
                src={agency.image}
                alt={agency.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            </div>

            {/* Agency Name and Location */}
            <div className="flex flex-col mt-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{agency.name}</h2>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                {agency.location}
              </p>
            </div>

            {/* Rating Section */}
            <div className="
              flex
              flex-row
              justify-between
              items-center
              w-full
              mt-4
            ">
              <p className="text-gray-700">Rating</p>
              <div className="w-[100px]">
                {renderStars()}
              </div>
            </div>

            {/* Status and Success Tours */}
            <div className="flex-1 flex flex-col justify-end mt-2">
              <div className="
                flex
                flex-row
                justify-between
                w-full
                mb-2
              ">
                <p className="text-sm text-gray-600">
                  <span>Status</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span>Success Tours</span>
                </p>
              </div>
              
              <div className="
                flex
                flex-row
                justify-between
                w-full
                mb-4
              ">
                <span className="text-lg font-bold">{agency.status}</span>
                <span className="text-lg font-bold">{agency.successTours}</span>
              </div>
              
              {/* Buttons */}
              <div className="flex flex-row gap-3">
                <button 
                  onClick={() => router.push(`/agency/${agency.id}/packages`)}
                  className="
                    w-1/2
                    h-[31px]
                    bg-[#008A1E]
                    text-white
                    font-medium
                    rounded-lg
                    hover:bg-green-700
                    transition-colors
                    duration-300
                    flex items-center justify-center
                  "
                >
                  View Packages
                </button>
                <button 
                  onClick={() => router.push(`/agency/${agency.id}`)}
                  className="
                    w-1/2
                    h-[31px]
                    bg-[#E6F4EA]
                    text-black
                    font-medium
                    rounded-lg
                    hover:bg-green-100
                    transition-colors
                    duration-300
                    flex items-center justify-center
                  "
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AgenciesSection;