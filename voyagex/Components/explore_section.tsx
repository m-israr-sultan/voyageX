'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const DestinationSection = () => {
  const router = useRouter(); // Add router

  const destinations = [
    {
      id: 1,
      name: 'Hunza',
      image: '/hunza.jpg',
      rating: 5,
      description: 'Experience majestic mountains, ancient forts, and the warm hospitality of local communities in this Himalayan paradise.',
      price: 'Rs: 15,000',
      packages: '5 Packages',
    },
    {
      id: 2,
      name: 'Skardu',
      image: '/skardu.jpg',
      rating: 4,
      description: 'Gateway to K2, with stunning lakes, rugged terrain, and adventure activities like trekking and mountaineering.',
      price: 'Rs: 15,000',
      packages: '5 Packages',
    },
    {
      id: 3,
      name: 'Kalam',
      image: '/kalam.jpg',
      rating: 4,
      description: 'Switzerland of Pakistan with lush green meadows, pine forests, and crystal-clear rivers perfect for nature lovers.',
      price: 'Rs: 15,000',
      packages: '5 Packages',
    },
    {
      id: 4,
      name: 'Swat',
      image: '/swat.jpg',
      rating: 5,
      description: 'The land of beauty with majestic mountains, waterfalls, and rich cultural heritage dating back to Gandhara civilization.',
      price: 'Rs: 15,000',
      packages: '5 Packages',
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <span 
            key={index} 
            className={`text-lg ${index < rating ? 'text-yellow-500' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Handle destination card click
  const handleCardClick = (destinationId: number, destinationName: string) => {
    const slug = destinationName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    router.push(`/Destination/${destinationId}/${slug}`);
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
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Destinations</h1>
        
        <Link 
          href="/Destination" // Changed from /destination to /Destination (capital D)
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
        {destinations.map((destination) => (
          <div 
            key={destination.id}
            className="
              h-[400px]
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
            onClick={() => handleCardClick(destination.id, destination.name)}
          >
            <div className="
              w-full
              h-[200px]
              sm:h-[210px]
              lg:h-[220px]
              xl:h-[230px]
              rounded-lg
              overflow-hidden
              relative
              hover:scale-[1.1]
              duration-300
            ">
              <Image
                src={destination.image}
                alt={destination.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            </div>

            <div className="flex flex-row justify-between items-center w-full h-[30px] mt-3">
              <h2 className="text-lg font-semibold">{destination.name}</h2>
              <div className="w-[100px]">
                {renderStars(destination.rating)}
              </div>
            </div>

            <p className="w-full flex-1 text-sm sm:text-[14px] font-normal leading-normal mt-2 text-gray-600">
              {destination.description}
            </p>

            <div className="mt-2">
              <div className="flex flex-row justify-between text-sm text-gray-500">
                <span>From</span>
                <span>Available</span>
              </div>
              
              <div className="flex flex-row justify-between mt-2">
                <span className="text-lg font-bold">{destination.price}</span>
                <span className="text-[#008A1E] font-semibold text-sm">
                  {destination.packages}
                </span>
              </div>
            </div>

            {/* View Details Button - Optional */}
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click
                handleCardClick(destination.id, destination.name);
              }}
              className="
                w-full
                h-[31px]
                bg-[#008A1E]
                text-white
                font-medium
                rounded-lg
                hover:bg-green-700
                transition-colors
                duration-300
                mt-3
              "
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DestinationSection;