"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { packagesApi } from "../lib/api";

const TestimonialSection = () => {
  const router = useRouter();
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await packagesApi.getAll({ limit: 10 });
        const result = response.data;
        if (result.success && result.data) {
          // Handle different response shapes
          let packagesList = result.data;
          
          // If it has items property, use that
          if (packagesList.items) {
            packagesList = packagesList.items;
          }
          
          // If it's still not an array, wrap it
          if (!Array.isArray(packagesList)) {
            packagesList = [packagesList];
          }

          const allReviews = packagesList.flatMap(
            (pkg: any) => (pkg.reviews || []).map((review: any) => ({
              ...review,
              packageName: pkg.title,
            }))
          );
          setTestimonials(allReviews.slice(0, 4));
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    fetchReviews();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const renderStars = (rating?: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < (rating || 5) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  const getUserName = (review: any): string => {
    if (review.user?.firstName && review.user?.lastName) {
      return `${review.user.firstName} ${review.user.lastName}`;
    }
    return review.user || "Traveler";
  };

  return (
    <section
      className="flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 mt-[100px] overflow-hidden"
      ref={sectionRef}
    >
      <div
        className={`transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        <h1 className="font-bold text-[36px] sm:text-[40px] md:text-[44px] lg:text-[48px] text-center">
          What Our Users Say !!
        </h1>
        <p className="font-medium text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] mt-2 text-center">
          We Build Trust and Friendship
        </p>
      </div>
      <button
        onClick={() => router.push("/shareexperience")}
        className={`mt-6 w-full max-w-[320px] h-[62px] rounded-[16px] bg-[#008A1E] text-white hover:bg-green-700 transition-all duration-500 flex items-center justify-center gap-2 px-8 group transform ${isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
      >
        <span className="font-medium text-[18px] sm:text-[20px]">
          Share Your Experience
        </span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </button>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 xl:gap-6 2xl:gap-8 mt-12 w-full max-w-[1536px] mx-auto">
        {testimonials.length > 0 ? (
          testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id || index}
              className={`w-full min-h-[260px] bg-[#DDFCFF] rounded-[24px] shadow-lg p-5 sm:p-6 flex flex-col transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                  <Image
                    src={testimonial.user?.avatar || "/user-placeholder.jpg"}
                    alt={getUserName(testimonial)}
                    fill
                    className="rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/user-placeholder.jpg";
                    }}
                  />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="font-medium text-[18px] sm:text-[20px] lg:text-[22px] mb-2 sm:mb-3">
                    {getUserName(testimonial)}
                  </p>
                  <div>{renderStars(testimonial.rating)}</div>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-normal text-[15px] sm:text-[16px] lg:text-[17px] leading-relaxed text-gray-800">
                  {testimonial.comment ||
                    "Amazing experience, highly recommend! Definitely recommended for others to join and enjoy their life"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <>
            {[1, 2, 3, 4].map((_, index) => (
              <div
                key={index}
                className={`w-full min-h-[260px] bg-[#DDFCFF] rounded-[24px] shadow-lg p-5 sm:p-6 flex flex-col transition-all duration-700 hover:shadow-xl hover:-translate-y-2 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                    <Image
                      src="/user-placeholder.jpg"
                      alt="User"
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <p className="font-medium text-[18px] sm:text-[20px] lg:text-[22px] mb-2 sm:mb-3">
                      Traveler
                    </p>
                    <div>{renderStars(5)}</div>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-normal text-[15px] sm:text-[16px] lg:text-[17px] leading-relaxed text-gray-800">
                    Amazing experience, highly recommend! Definitely recommended for others to join and enjoy their life
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
};

export default TestimonialSection;