"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { packagesApi } from "../lib/api";
import { getImageUrl } from "../lib/image-utils";

interface Package {
  id: string;
  slug: string;
  title: string;
  author: string;
  image: string;
  price: number;
  capacity: string;
  duration: number;
  location: string;
  rating: number;
}

const PackagesSection = () => {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await packagesApi.getAll({ limit: 4 });
        const result = response.data;

        if (result.success && result.data) {
          const items = result.data.items || result.data || [];
          const packagesArray = Array.isArray(items) ? items.slice(0, 4) : [items]; // ENSURE ONLY 4

          const transformedPackages: Package[] = packagesArray.map((pkg: any) => {
            let authorName = "By VoyageX";
            if (pkg.guide?.users) {
              const userData = pkg.guide.users;
              authorName = userData.firstName && userData.lastName 
                ? `${userData.firstName} ${userData.lastName}`
                : userData.firstName || "Tour Guide";
            } else if (pkg.agency?.name) {
              authorName = pkg.agency.name;
            }
            
            return {
              id: pkg.id,
              slug: pkg.slug,
              title: pkg.title || "Package",
              author: authorName,
              image: getImageUrl(pkg.images?.[0] || pkg.image),
              price: pkg.price || 0,
              capacity: pkg.capacity ? `${pkg.capacity} persons` : "N/A",
              duration: pkg.duration || 1,
              location: pkg.location || "Pakistan",
              rating: pkg.rating || 0,
            };
          });

          setPackages(transformedPackages);
          setError(null);
        } else {
          setError(result.message || "Failed to load packages");
        }
      } catch (err: any) {
        console.error("Error fetching packages:", err);
        const message = err.response?.data?.message || err.message || "Failed to load packages.";
        setError(message);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`text-lg ${index < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleCardClick = (pkg: Package) => {
    router.push(`/packages/${pkg.slug}`);
  };

  if (loading) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
            Packages
          </h1>
          <Link
            href="/packages"
            className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
          >
            <span>See More</span>
            <ArrowRight size={20} className="w-5 h-5" />
          </Link>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E]"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
            Packages
          </h1>
          <Link
            href="/packages"
            className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
          >
            <span>See More</span>
            <ArrowRight size={20} className="w-5 h-5" />
          </Link>
        </div>
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#008A1E] text-white rounded-lg hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-[90px] flex flex-col w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
      <div className="flex flex-row justify-between items-center w-full max-w-[1536px] mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-[32px] lg:text-[36px] xl:text-[40px] font-semibold">
          Packages
        </h1>
        <Link
          href="/packages"
          className="flex flex-row justify-center items-center gap-2 text-base sm:text-lg md:text-[20px] hover:text-green-600 transition-colors"
        >
          <span>See More</span>
          <ArrowRight size={20} className="w-5 h-5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-6 2xl:gap-8 mt-6 w-full max-w-[1536px] mx-auto">
        {packages.slice(0, 4).map((pkg) => (
          <div
            key={pkg.id}
            className="h-[420px] bg-white rounded-lg shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] flex flex-col p-2 sm:p-3 lg:p-4 cursor-pointer"
            onClick={() => handleCardClick(pkg)}
          >
            <div className="w-full h-[180px] sm:h-[190px] lg:h-[200px] xl:h-[210px] rounded-lg overflow-hidden relative mb-3">
              <img
                src={pkg.image}
                alt={pkg.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/agency-placeholder.jpg";
                }}
              />
            </div>

            <div className="flex flex-col">
              <h2 className="text-lg font-semibold line-clamp-1">{pkg.title}</h2>
              <p className="text-gray-600 text-sm mt-1">{pkg.author}</p>
            </div>

            <div className="flex flex-row justify-between items-center w-full mt-4">
              <p className="text-gray-700">Rating</p>
              <div className="w-[100px]">{renderStars(pkg.rating)}</div>
            </div>

            <div className="flex-1 flex flex-col justify-end mt-2">
              <div className="flex flex-row justify-between w-full mb-2">
                <p className="text-sm text-gray-600">Price</p>
                <p className="text-sm text-gray-600">Capacity</p>
              </div>

              <div className="flex flex-row justify-between w-full mb-4">
                <span className="text-lg font-bold">
                  {pkg.price > 0 ? `${pkg.price.toLocaleString()} Rs` : "Contact for price"}
                </span>
                <span className="text-lg font-bold">{pkg.capacity}</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick(pkg);
                }}
                className="w-full h-[31px] bg-[#008A1E] text-white font-medium rounded-lg hover:bg-green-700 transition-colors duration-300"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {packages.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500">No packages found.</p>
        </div>
      )}
    </section>
  );
};

export default PackagesSection;