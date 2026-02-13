'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, MapPin, CheckCircle } from 'lucide-react';

const GuidesSection = () => {
  const router = useRouter(); // Add router

  const guides = [
    {
      id: 1,
      name: 'Muhammad Afnan',
      location: 'Hunza, Gilgit baltistan',
      image: '/guid 1.jpg',
      pricePerDay: '3000 Pkr',
      specialty: 'Tracking, hiking',
    },
    {
      id: 2,
      name: 'Zakir Ullah',
      location: 'Hunza, Gilgit baltistan',
      image: '/guid 2.jpg',
      pricePerDay: '3000 Pkr',
      specialty: 'culture, driving',
    },
    {
      id: 3,
      name: 'Yasir',
      location: 'Hunza, Gilgit baltistan',
      image: '/guid 3.jpg',
      pricePerDay: '3000 Pkr',
      specialty: 'food, events',
    },
    {
      id: 4,
      name: 'Muhammad',
      location: 'Hunza, Gilgit baltistan',
      image: '/guid 4.jpg',
      pricePerDay: '3000 Pkr',
      specialty: 'historical places, storytelling',
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

  // Handle guide card click
  const handleCardClick = (guideId: number, guideName: string) => {
    const slug = guideName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    router.push(`/Guide/${guideId}/${slug}`);
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
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Guides</h1>
        
        <Link 
          href="/Guide" // Changed from /guides to /Guide (capital G)
          className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
        >
          <span>See More</span>
          <ArrowRight size={20} className="w-5 h-5" />
        </Link>
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
        {guides.map((guide) => (
          <div 
            key={guide.id}
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
              cursor-pointer
            "
            onClick={() => handleCardClick(guide.id, guide.name)}
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
                src={guide.image}
                alt={guide.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            </div>

            {/* Guide Name and Location */}
            <div className="flex flex-col mt-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{guide.name}</h2>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-600 text-sm mt-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                {guide.location}
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

            {/* Price Per Day and Specialty */}
            <div className="flex-1 flex flex-col justify-end mt-2">
              <div className="
                flex
                flex-row
                justify-between
                w-full
                mb-2
              ">
                <p className="text-sm text-gray-600">
                  <span>Price Per Day</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span>Specialty</span>
                </p>
              </div>
              
              <div className="
                flex
                flex-row
                justify-between
                w-full
                mb-4
              ">
                <span className="text-lg font-bold">{guide.pricePerDay}</span>
                <span className="text-lg font-bold">{guide.specialty}</span>
              </div>

              {/* Buttons */}
              <div className="flex flex-row gap-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    handleCardClick(guide.id, guide.name);
                  }}
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
                  "
                >
                  View Profile
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    router.push(`/chat/${guide.id}`);
                  }}
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
                  "
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default GuidesSection;