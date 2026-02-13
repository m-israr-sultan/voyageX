"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaPaperPlane,
  FaArrowLeft,
  FaEnvelope,
  FaCheck,
  FaCheckDouble,
  FaPhone,
  FaVideo,
  FaEllipsisV,
  FaStar,
  FaMapMarkerAlt,
  FaUser,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
} from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";
import Navbar from "@/Components/navbar";

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface Guide {
  id: number;
  name: string;
  image: string;
  location: string;
  rating: number;
  pricePerDay: number;
  specialty: string;
  isOnline?: boolean;
}

export default function GuideMessagesPage() {
  const params = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const guideId = params.id as string;

  // Fetch guide details and messages
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock guide data - fetch from your guides data
      const mockGuides: { [key: string]: Guide } = {
        "1": {
          id: 1,
          name: "Muhammad Afnan",
          image: "/guid 1.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          isOnline: true,
        },
        "2": {
          id: 2,
          name: "Zakir Ullah",
          image: "/guid 2.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 4,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          isOnline: false,
        },
        "3": {
          id: 3,
          name: "Yasir",
          image: "/guid 3.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          isOnline: true,
        },
        "4": {
          id: 4,
          name: "Muhammad",
          image: "/guid 4.jpg",
          location: "Hunza, Gilgit Baltistan",
          rating: 4,
          pricePerDay: 3000,
          specialty: "Trekking, Hiking",
          isOnline: false,
        },
        "5": {
          id: 5,
          name: "Ali Hassan",
          image: "/guid 1.jpg",
          location: "Skardu, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 3500,
          specialty: "Mountain Climbing",
          isOnline: false,
        },
        "6": {
          id: 6,
          name: "Ahmed Khan",
          image: "/guid 2.jpg",
          location: "Naran, Khyber Pakhtunkhwa",
          rating: 4,
          pricePerDay: 2500,
          specialty: "Camping, Fishing",
          isOnline: true,
        },
        "7": {
          id: 7,
          name: "Sara Ahmed",
          image: "/female1.jpg",
          location: "Swat, Khyber Pakhtunkhwa",
          rating: 5,
          pricePerDay: 2800,
          specialty: "Cultural Tours",
          isOnline: false,
        },
        "8": {
          id: 8,
          name: "Usman Ali",
          image: "/guid 4.jpg",
          location: "Murree, Punjab",
          rating: 4,
          pricePerDay: 2000,
          specialty: "Family Tours",
          isOnline: false,
        },
        "9": {
          id: 9,
          name: "Bilal Khan",
          image: "/guid 1.jpg",
          location: "Fairy Meadows, Gilgit Baltistan",
          rating: 5,
          pricePerDay: 4000,
          specialty: "Adventure Trekking",
          isOnline: true,
        },
        "10": {
          id: 10,
          name: "Nadia Shah",
          image: "/female2.jpg",
          location: "Kalam, Khyber Pakhtunkhwa",
          rating: 4,
          pricePerDay: 2700,
          specialty: "Photography Tours",
          isOnline: false,
        },
        "11": {
          id: 11,
          name: "Kamran Malik",
          image: "/guid 3.jpg",
          location: "Neelum Valley, Azad Kashmir",
          rating: 5,
          pricePerDay: 3200,
          specialty: "River Rafting",
          isOnline: true,
        },
        "12": {
          id: 12,
          name: "Fatima Noor",
          image: "/female3.jpg",
          location: "Chitral, Khyber Pakhtunkhwa",
          rating: 4,
          pricePerDay: 2900,
          specialty: "Cultural Heritage",
          isOnline: false,
        },
      };

      const guideData = mockGuides[guideId];
      
      if (guideData) {
        setGuide(guideData);
        
        // Mock messages for this conversation
        const mockMessages: Message[] = [
          {
            id: 1,
            senderId: parseInt(guideId),
            receiverId: 1,
            content: `Hello! I'm ${guideData.name}. How can I help you plan your trip?`,
            timestamp: "10:00 AM",
            status: "read",
          },
          {
            id: 2,
            senderId: 1,
            receiverId: parseInt(guideId),
            content: `Hi! I'm interested in booking a tour with you.`,
            timestamp: "10:05 AM",
            status: "read",
          },
          {
            id: 3,
            senderId: parseInt(guideId),
            receiverId: 1,
            content: `Great! I specialize in ${guideData.specialty}. What dates are you planning to visit?`,
            timestamp: "10:10 AM",
            status: "read",
          },
          {
            id: 4,
            senderId: 1,
            receiverId: parseInt(guideId),
            content: `I'm available next week. How about Tuesday?`,
            timestamp: "10:15 AM",
            status: "read",
          },
          {
            id: 5,
            senderId: parseInt(guideId),
            receiverId: 1,
            content: `Yes, I'm available on Tuesday! My price is ${guideData.pricePerDay.toLocaleString()} PKR per day.`,
            timestamp: "10:30 AM",
            status: "delivered",
          },
        ];

        setMessages(mockMessages);
      }
      
      setLoading(false);
    };

    if (guideId) {
      fetchData();
    }
  }, [guideId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus message input
  useEffect(() => {
    messageInputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !guide) return;

    setSending(true);

    const message: Message = {
      id: messages.length + 1,
      senderId: 1, // Current user
      receiverId: guide.id,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "sent",
    };

    setMessages([...messages, message]);
    setNewMessage("");
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={`w-4 h-4 ${
              index < rating
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <FaCheck className="w-3 h-3 text-gray-400" />;
      case "delivered":
        return <FaCheckDouble className="w-3 h-3 text-gray-400" />;
      case "read":
        return <FaCheckDouble className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#008A1E] mb-4"></div>
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#F2F4F7]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Guide not found</h1>
            <Link
              href="/Guide"
              className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium"
            >
              <FaArrowLeft /> Back to Guides
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-[#008A1E] hover:text-[#006816] font-medium transition-colors"
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {/* Messages Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-250px)] min-h-[600px] flex flex-col">
          {/* Chat Header - Guide Info */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-4">
              {/* Guide Avatar */}
              <Link href={`/Guide/${guide.name.toLowerCase().replace(/\s+/g, '-')}`} className="relative">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={guide.image}
                    alt={guide.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {guide.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </Link>

              {/* Guide Info */}
              <div>
                <Link 
                  href={`/Guide/${guide.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="hover:text-[#008A1E] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{guide.name}</h2>
                    {renderStars(guide.rating)}
                  </div>
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FaMapMarkerAlt className="w-3 h-3" />
                  <span>{guide.location}</span>
                  <span className="mx-2">•</span>
                  <span className="text-[#008A1E] font-medium">{guide.pricePerDay.toLocaleString()} PKR/day</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <FaPhone className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <FaVideo className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
                <FaEllipsisV className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === 1 ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end gap-2 max-w-[70%]">
                    {message.senderId !== 1 && (
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <Image
                          src={guide.image}
                          alt={guide.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        message.senderId === 1
                          ? "bg-[#008A1E] text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div
                        className={`flex items-center justify-end gap-1 mt-1 text-xs ${
                          message.senderId === 1 ? "text-green-100" : "text-gray-500"
                        }`}
                      >
                        <span>{message.timestamp}</span>
                        {message.senderId === 1 && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#008A1E] focus:bg-white transition-colors"
                disabled={sending}
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 bg-[#008A1E] text-white rounded-full flex items-center justify-center hover:bg-[#006816] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#008a1e] text-white pt-12 pb-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">VoyageX</div>
              <p className="text-gray-200 mb-6 text-sm leading-relaxed">
                Lorem ipsum dolor sit amet consectetur. Tincidunt bibendum mauris
                ultricies eu lacus. Nulla tincidunt diam risus nullam euismod lore
              </p>
              <div className="flex gap-3">
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#005a14] transition-colors">
                  <FaTwitter className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#005a14] transition-colors">
                  <FaFacebookF className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 bg-[#006816] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#005a14] transition-colors">
                  <FaInstagram className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2">
                {["Home", "About", "Packages", "Destination", "Contact"].map(
                  (item) => (
                    <li
                      key={item}
                      className="text-gray-200 hover:text-white cursor-pointer transition-colors"
                    >
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Help Center</h3>
              <ul className="space-y-2">
                {[
                  "Terms & Services",
                  "Privacy",
                  "Cancelation Policy",
                  "Report",
                  "Support Team",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-gray-200 hover:text-white cursor-pointer transition-colors"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Now Here ?</h3>
              <p className="text-gray-200 mb-4 text-sm">
                Subscribe to get special offers and travel tips
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full px-4 py-3 rounded-2xl border-none outline-none text-gray-800 text-sm"
                />
                <button className="w-full px-4 py-3 bg-[#D6FFDF] text-gray-800 rounded-2xl font-medium hover:bg-white transition-colors">
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}