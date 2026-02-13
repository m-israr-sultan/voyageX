'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // Navigation items
  const navItems = [
    { name: 'Destinations', path: '/Destination' },
    { name: 'Customize', path: '/Customize' },
    { name: 'Packages', path: '/Packages' },
  ];

  // Auth items
  const authItems = [
    { name: 'Login', path: '/Login' },
    { name: 'Sign Up', path: '/Register', isButton: true },
  ];

  return (
    <nav className="
      /* Base Styles */
      flex flex-row justify-between items-center
      bg-white
      w-full h-20
      mx-auto z-50
      
      /* Container Constraints - REMOVED max-w-7xl and px classes */
      /* Positioning */
      relative 
    ">
      {/* Logo - with left padding only */}
      <div className="pl-4 sm:pl-6 lg:pl-8 xl:pl-10 2xl:pl-12">
        <Link href="/" className="flex items-center">
          <Image
            src="/voyageX-logo.png"
            alt="VoyageX Logo"
            width={217}
            height={50}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Desktop Navigation Links - Show at 768px+ (lg:flex) */}
      <div className="hidden lg:flex flex-1 justify-center">
        <ul className="flex flex-row justify-center items-center gap-6 lg:gap-8 xl:gap-10 list-none">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={`
                  ${pathname === item.path 
                    ? 'text-green-600 font-semibold' 
                    : 'text-gray-800 hover:text-green-600'
                  }
                  cursor-pointer transition-colors duration-200 font-medium
                  text-sm lg:text-base xl:text-lg
                `}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Desktop Auth Links - Show at 768px+ (lg:flex) - with right padding only */}
      <div className="hidden lg:flex pr-4 sm:pr-6 lg:pr-8 xl:pr-10 2xl:pr-12">
        <ul className="flex flex-row justify-center items-center gap-4 lg:gap-6 xl:gap-8 list-none">
          {authItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.path}
                className={`
                  ${item.isButton
                    ? 'bg-green-600 text-white px-4 lg:px-6 py-2 rounded-full hover:bg-green-700 text-sm lg:text-base'
                    : pathname === item.path
                      ? 'text-green-600 font-semibold'
                      : 'text-gray-800 hover:text-green-600'
                  }
                  cursor-pointer transition-colors duration-200 font-medium
                  text-sm lg:text-base
                `}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Menu Button - Hide at 768px+ (lg:hidden) - with right padding only */}
      <div className="lg:hidden flex items-center pr-4 sm:pr-6">
        <button
          className="
            w-10 h-10
            flex items-center justify-center
            rounded-lg
            hover:bg-green-50
            transition-colors duration-200
            focus:outline-none
          "
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {/* Animated Hamburger Icon */}
          <div className="space-y-1.5">
            <span className={`
              block w-6 h-0.5 bg-gray-700 transition-all duration-300
              ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}
            `}></span>
            <span className={`
              block w-6 h-0.5 bg-gray-700 transition-all duration-300
              ${isMenuOpen ? 'opacity-0' : 'opacity-100'}
            `}></span>
            <span className={`
              block w-6 h-0.5 bg-gray-700 transition-all duration-300
              ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}
            `}></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu Dropdown - FIXED VERSION */}
      {isMenuOpen && (
        <div className="
          fixed top-20 left-0 right-0 bottom-0
          bg-white
          lg:hidden
          z-50
          overflow-y-auto
        ">
          <div className="flex flex-col h-full">
            {/* Navigation Links Section */}
            <div className="p-6 border-b border-gray-100">
              <div className="text-gray-500 text-sm font-medium mb-4">
                Navigation
              </div>
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`
                      ${pathname === item.path 
                        ? 'text-green-600 font-semibold bg-green-50' 
                        : 'text-gray-800 hover:text-green-600 hover:bg-gray-50'
                      }
                      cursor-pointer transition-colors duration-200 
                      font-medium py-3 px-4 rounded-lg
                      text-base
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Auth Links Section - FIXED POSITIONING */}
            <div className="p-6 mt-auto border-t border-gray-100">
              <div className="text-gray-500 text-sm font-medium mb-4">
                Account
              </div>
              <div className="flex flex-col gap-3">
                {authItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`
                      ${item.isButton
                        ? 'bg-green-600 text-white hover:bg-green-700 text-center'
                        : pathname === item.path
                          ? 'text-green-600 font-semibold bg-green-50'
                          : 'text-gray-800 hover:text-green-600 hover:bg-gray-50'
                      }
                      cursor-pointer transition-colors duration-200 
                      font-medium py-3 px-4 rounded-lg
                      text-base
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Close Menu Button at Bottom */}
            <div className="p-6 bg-gray-50">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-full py-3 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors duration-200"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;