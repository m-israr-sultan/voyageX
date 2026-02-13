'use client';

import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const TestimonialSection = () => {
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

  const testimonials = [
    {
      id: 1,
      name: 'M.Afnan',
      image: '/guid 1.jpg',
      testimonial: 'Amazing experience, highly recommend! Definitely recommended for others to join and enjoy their life'
    },
    {
      id: 2,
      name: 'zakir Ullah',
      image: '/guid 2.jpg',
      testimonial: 'Amazing experience, highly recommend! Definitely recommended for others to join and enjoy their life'
    },
    {
      id: 3,
      name: 'Yasir',
      image: '/guid 3.jpg',
      testimonial: 'Amazing experience, highly recommend! Definitely recommended for others to join and enjoy their life'
    },
    {
      id: 4,
      name: 'Muhammad',
      image: '/guid 4.jpg',
      testimonial: 'Amazing experience, highly recommend! Definitely recommended for others to join and enjoy their life'
    },
  ];

  const renderStars = () => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <Star 
            key={index}
            className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 fill-yellow-500 transition-transform duration-300 hover:scale-110"
          />
        ))}
      </div>
    );
  };

  return (
    <section className="
      flex flex-col items-center
      w-full
      px-4
      sm:px-6
      lg:px-8
      xl:px-10
      2xl:px-12
      mt-[100px]
      overflow-hidden
    " ref={sectionRef}>
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
          What Our User Says !!
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
          We Build Trust and Friendship
        </p>
      </div>
      
      {/* Share Your Experience Button with scale animation */}
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
          Share Your Experience
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

      {/* Testimonial Cards Container with staggered animations */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-4
        gap-4
        sm:gap-5
        lg:gap-6
        xl:gap-6
        2xl:gap-8
        mt-12
        w-full
        max-w-[1536px]
        mx-auto
      ">
        {testimonials.map((testimonial, index) => (
          <div 
            key={testimonial.id}
            className={`
              w-full
              min-h-[260px]
              sm:min-h-[240px]
              lg:min-h-[220px]
              bg-[#DDFCFF]
              rounded-[24px]
              shadow-[3px_8px_10px_2px_rgba(0,0,0,0.15)]
              p-5
              sm:p-6
              flex flex-col
              transition-all duration-700
              hover:shadow-xl
              hover:-translate-y-2
              transform
              ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
            `}
            style={{
              transitionDelay: `${index * 100}ms`
            }}
          >
            {/* Top Section - User Info */}
            <div className="flex flex-row items-start gap-3 mb-4">
              {/* Avatar with hover animation */}
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  fill
                  className="rounded-full object-cover transition-transform duration-500 hover:scale-110"
                  sizes="(max-width: 640px) 48px, 56px"
                />
              </div>
              
              {/* Name and Stars - Stacked vertically */}
              <div className="flex flex-col flex-1 min-w-0">
                {/* Name */}
                <p className="
                  font-medium
                  text-[18px]
                  sm:text-[20px]
                  lg:text-[22px]
                  break-words
                  mb-2
                  sm:mb-3
                  transition-transform duration-300 hover:translate-x-1
                ">
                  {testimonial.name}
                </p>
                
                {/* Stars - Always below name */}
                <div>
                  {renderStars()}
                </div>
              </div>
            </div>

            {/* Testimonial Text */}
            <div className="flex-1">
              <p className="
                font-normal
                text-[15px]
                sm:text-[16px]
                lg:text-[17px]
                leading-relaxed
                text-gray-800
                transition-transform duration-300 hover:translate-x-1
              ">
                {testimonial.testimonial}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialSection;