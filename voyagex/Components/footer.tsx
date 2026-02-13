'use client';

import Image from 'next/image';
import { MdOutlineMail } from 'react-icons/md';
import { FaTwitter, FaFacebookF, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer 
      className="
        bg-[#008a1e] 
        text-white
        mt-[123px]
        w-full
      "
    >
      <div className="
        flex
        flex-col
        lg:flex-row
        justify-between
        items-start
        w-full
        px-4
        sm:px-6
        lg:px-8
        xl:px-10
        2xl:px-12
        py-8
        sm:py-10
        lg:py-12
        max-w-[1536px]
        mx-auto
        gap-8
        lg:gap-6
        xl:gap-8
        2xl:gap-10
      ">
        {/* Logo and About Section */}
        <div className="
          w-full
          lg:w-[369px]
          flex flex-col
        ">
         <div className="relative w-full max-w-[369px] h-[72px] mb-6">
  <Image
    src="/white-logo.png"
    alt="VoyageX Logo"
    fill
    className="object-contain"
    sizes="369px"
    priority
  />
</div>
          <p className="
            font-normal
            text-[14px]
            sm:text-[15px]
            lg:text-[16px]
            xl:text-[17px]
            2xl:text-[18px]
            leading-relaxed
            mb-6
            sm:mb-8
            w-full
            lg:w-[350px]
          ">
            Discover the hidden gems of Pakistan with trusted local guides. Experience authentic adventures, support local communities, and create unforgettable memories with VoyageX.
          </p>
          <div className="flex flex-row gap-3 sm:gap-4">
            {/* Twitter */}
            <div className="
              w-14 h-14
              sm:w-16 sm:h-16
              lg:w-18 lg:h-18
              xl:w-20 xl:h-20
              2xl:w-[74px] 2xl:h-[74px]
              bg-[#006816]
              rounded-full
              flex items-center justify-center
              p-3
              sm:p-4
              transition-all duration-300
              hover:scale-110
              hover:bg-[#005a14]
              hover:shadow-lg
              cursor-pointer
            ">
              <FaTwitter className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9" />
            </div>
            
            {/* Facebook */}
            <div className="
              w-14 h-14
              sm:w-16 sm:h-16
              lg:w-18 lg:h-18
              xl:w-20 xl:h-20
              2xl:w-[74px] 2xl:h-[74px]
              bg-[#006816]
              rounded-full
              flex items-center justify-center
              p-3
              sm:p-4
              transition-all duration-300
              hover:scale-110
              hover:bg-[#005a14]
              hover:shadow-lg
              cursor-pointer
            ">
              <FaFacebookF className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9" />
            </div>
            
            {/* Instagram */}
            <div className="
              w-14 h-14
              sm:w-16 sm:h-16
              lg:w-18 lg:h-18
              xl:w-20 xl:h-20
              2xl:w-[74px] 2xl:h-[74px]
              bg-[#006816]
              rounded-full
              flex items-center justify-center
              p-3
              sm:p-4
              transition-all duration-300
              hover:scale-110
              hover:bg-[#005a14]
              hover:shadow-lg
              cursor-pointer
            ">
              <FaInstagram className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-9 xl:h-9" />
            </div>
          </div>
        </div>

        {/* Become a Partner */}
        <div className="
          w-full
          lg:w-[187px]
        ">
          <p className="
            font-semibold
            text-[16px]
            sm:text-[17px]
            lg:text-[18px]
            px-4
            py-2
            mb-2
          ">
            Become a partner
          </p>
          <ul className="list-none">
            {['Travel Agency', 'Tour Guide'].map((item) => (
              <li 
                key={item}
                className="
                  px-4
                  py-2
                  text-[14px]
                  sm:text-[15px]
                  lg:text-[16px]
                  transition-colors duration-300
                  hover:text-green-200
                  cursor-pointer
                "
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Links */}
        <div className="
          w-full
          lg:w-[153px]
        ">
          <h2 className="
            font-semibold
            text-[16px]
            sm:text-[17px]
            lg:text-[18px]
            px-4
            py-2
            mb-2
          ">
            Quick Links
          </h2>
          <ul className="list-none">
            {['Home', 'About', 'Packages', 'Destination', 'Contact'].map((item) => (
              <li 
                key={item}
                className="
                  px-4
                  py-2
                  text-[14px]
                  sm:text-[15px]
                  lg:text-[16px]
                  transition-colors duration-300
                  hover:text-green-200
                  cursor-pointer
                "
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Help Center */}
        <div className="
          w-full
          lg:w-[189px]
        ">
          <h2 className="
            font-semibold
            text-[16px]
            sm:text-[17px]
            lg:text-[18px]
            px-4
            py-2
            mb-2
          ">
            Help Center
          </h2>
          <ul className="list-none">
            {['Terms & Services', 'Privacy', 'Cancellation Policy', 'Report', 'Support Team'].map((item) => (
              <li 
                key={item}
                className="
                  px-4
                  py-2
                  text-[14px]
                  sm:text-[15px]
                  lg:text-[16px]
                  transition-colors duration-300
                  hover:text-green-200
                  cursor-pointer
                "
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter Section */}
        <div className="
          w-full
          lg:w-[275px]
        ">
          <h2 className="
            font-semibold
            text-[16px]
            sm:text-[17px]
            lg:text-[18px]
            px-4
            py-2
            mb-2
          ">
            Now Here?
          </h2>
          <ul className="list-none">
            <li className="
              px-4
              py-2
              text-[14px]
              sm:text-[15px]
              lg:text-[16px]
              mb-2
            ">
              Subscribe to get special offers and travel tips
            </li>
            <li className="px-4 py-2">
              <input
                type="email"
                placeholder="Email Address"
                className="
                  w-full
                  h-[44px]
                  sm:h-[46px]
                  lg:h-[49px]
                  px-4
                  rounded-[16px]
                  border-none
                  focus:outline-none
                  focus:ring-2 focus:ring-green-300
                  text-gray-800
                  text-[14px]
                  sm:text-[15px]
                  bg-white
                "
              />
            </li>
            <li className="px-4 py-2">
              <button className="
                w-full
                h-[44px]
                sm:h-[46px]
                lg:h-[49px]
                px-4
                rounded-[16px]
                border-none
                bg-[#D6FFDF]
                text-gray-800
                font-medium
                text-[14px]
                sm:text-[15px]
                transition-all duration-300
                hover:bg-green-100
                hover:scale-[1.02]
                active:scale-[0.98]
              ">
                Sign Up
              </button>
            </li>
            <li className="
              px-4
              py-2
              mt-4
              flex items-center
              text-[14px]
              sm:text-[15px]
              lg:text-[16px]
            ">
              <MdOutlineMail className="w-5 h-5 mr-3" />
              VoyageX@gmail.com
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;