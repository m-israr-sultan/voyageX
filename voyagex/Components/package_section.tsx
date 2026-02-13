'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

const PackagesSection = () => {
  const router = useRouter(); // Add router

  const packages = [
    {
      id: 1,
      title: '3 Days in Swat',
      author: 'By Muhammad Umair',
      image: '/swat.jpg',
      price: '24000Pkr',
      capacity: '14/20',
      duration: '3 Days',
      location: 'Swat'
    },
    {
      id: 2,
      title: '5 Days in Hunza',
      author: 'By Muhammad Umair',
      image: '/hunza.jpg',
      price: '24000Pkr',
      capacity: '14/20',
      duration: '5 Days',
      location: 'Hunza'
    },
    {
      id: 3,
      title: '7 Days in Skardu',
      author: 'By Muhammad Umair',
      image: '/skardu.jpg',
      price: '24000Pkr',
      capacity: '14/20',
      duration: '7 Days',
      location: 'Skardu'
    },
    {
      id: 4,
      title: '50 Days in Kalam',
      author: 'By Muhammad Umair',
      image: '/kalam.jpg',
      price: '24000Pkr',
      capacity: '14/20',
      duration: '50 Days',
      location: 'Kalam'
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

  // Handle card click
  const handleCardClick = (pkgId: number, pkgTitle: string) => {
    const slug = pkgTitle
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    router.push(`/Packages/${pkgId}/${slug}`);
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
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">Packages</h1>
        
        <Link 
          href="/Packages" // Changed from /packages to /Packages to match your routing
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
        {packages.map((pkg) => (
          <div 
            key={pkg.id}
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
            onClick={() => handleCardClick(pkg.id, pkg.title)}
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
                src={pkg.image}
                alt={pkg.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              />
            </div>

            {/* Title and Author */}
            <div className="flex flex-col mt-3">
              <h2 className="text-lg font-semibold">{pkg.title}</h2>
              <p className="text-gray-600 text-sm mt-1">{pkg.author}</p>
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

            {/* Price and Capacity */}
            <div className="flex-1 flex flex-col justify-end mt-2">
              <div className="
                flex
                flex-row
                justify-between
                w-full
                mb-2
              ">
                <p className="text-sm text-gray-600">
                  <span>Price</span>
                </p>
                <p className="text-sm text-gray-600">
                  <span>Capacity</span>
                </p>
              </div>
              
              <div className="
                flex
                flex-row
                justify-between
                w-full
                mb-4
              ">
                <span className="text-lg font-bold">{pkg.price}</span>
                <span className="text-lg font-bold">{pkg.capacity}</span>
              </div>

              {/* View Details Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  handleCardClick(pkg.id, pkg.title);
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
                "
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PackagesSection;