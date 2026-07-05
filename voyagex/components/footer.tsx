"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MdOutlineMail } from "react-icons/md";
import {
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!email) {
      setError("Please enter email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      // Newsletter subscription — client-side only for now
      // Backend doesn't have a newsletter endpoint
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    } catch (err) {
      setError("Subscription failed");
    } finally {
      setIsLoading(false);
    }
  };

  const partnerLinks = [
    { name: "Travel Agency", path: "/register/agency" },
    { name: "Tour Guide", path: "/register/guideregistration" },
  ];
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/" },
    { name: "Packages", path: "/packages" },
    { name: "Destination", path: "/destination" },
    { name: "Contact", path: "/" },
  ];
  const helpLinks = [
    { name: "Terms & Services", path: "/" },
    { name: "Privacy", path: "/" },
    { name: "Cancellation Policy", path: "/" },
    { name: "Report", path: "/report" },
    { name: "Support Team", path: "/report" },
  ];
  const socialLinks = [
    { icon: FaTwitter, url: "https://twitter.com/voyagex", label: "Twitter" },
    {
      icon: FaFacebookF,
      url: "https://facebook.com/voyagex",
      label: "Facebook",
    },
    {
      icon: FaInstagram,
      url: "https://instagram.com/voyagex",
      label: "Instagram",
    },
    {
      icon: FaLinkedinIn,
      url: "https://linkedin.com/company/voyagex",
      label: "LinkedIn",
    },
  ];

  return (
    <footer className="bg-[#008a1e] text-white mt-[50px] w-full rounded-t-3xl">
      <div className="flex flex-col lg:flex-row justify-between items-start w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-8 sm:py-10 lg:py-12 max-w-[1536px] mx-auto gap-8 lg:gap-6">
        <div className="w-full lg:w-[369px] flex flex-col">
          <Link
            href="/"
            className="relative w-full max-w-[369px] h-[72px] mb-6 block"
          >
            <Image
              src="/white-logo.png"
              alt="VoyageX Logo"
              fill
              className="object-contain"
              priority
            />
          </Link>
          <p className="text-gray-200 text-sm leading-relaxed mb-6">
            Discover the hidden gems of Pakistan with trusted local guides.
            Experience authentic adventures, support local communities, and
            create unforgettable memories with VoyageX.
          </p>
          <div className="flex gap-3">
            {socialLinks.map((social, i) => (
              <a
                key={i}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-14 h-14 bg-[#006816] rounded-full flex items-center justify-center hover:scale-110 hover:bg-[#005a14] transition"
              >
                <social.icon className="w-6 h-6" />
              </a>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-[187px]">
          <p className="font-semibold text-lg mb-4 px-4">Become a partner</p>
          <ul>
            {partnerLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className="block px-4 py-2 text-gray-200 hover:text-white transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:w-[153px]">
          <h2 className="font-semibold text-lg mb-4 px-4">Quick Links</h2>
          <ul>
            {quickLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className="block px-4 py-2 text-gray-200 hover:text-white transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="w-full lg:w-[189px]">
          <h2 className="font-semibold text-lg mb-4 px-4">Help Center</h2>
          <ul>
            {helpLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.path}
                  className="block px-4 py-2 text-gray-200 hover:text-white transition"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full lg:w-[275px]">
          <h2 className="font-semibold text-lg mb-4 px-4">Newsletter</h2>
          <ul>
            <li className="px-4 py-2 text-gray-200 text-sm mb-2">
              Subscribe to get special offers and travel tips
            </li>
            <li className="px-4 py-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full h-12 px-4 rounded-2xl border-none outline-none text-gray-800"
              />
            </li>
            {error && <li className="px-4 text-red-300 text-sm">{error}</li>}
            {isSubscribed && (
              <li className="px-4 text-green-300 text-sm">
                ✓ Subscribed successfully!
              </li>
            )}
            <li className="px-4 py-2">
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-12 bg-[#D6FFDF] text-gray-800 rounded-2xl font-medium hover:bg-white transition disabled:opacity-50"
              >
                {isLoading ? "Subscribing..." : "Sign Up"}
              </button>
            </li>
            <li className="px-4 py-2 mt-4 flex items-center text-gray-200">
              <MdOutlineMail className="w-5 h-5 mr-3" />
              <a href="mailto:VoyageX@gmail.com" className="hover:text-white">
                VoyageX@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/20 mt-4 pt-4 pb-6 text-center">
        <p className="text-white/80 text-sm">
          &copy; {new Date().getFullYear()} VoyageX. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;