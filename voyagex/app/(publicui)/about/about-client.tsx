"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsappbutton";
import {
  FaLinkedin,
  FaTwitter,
  FaEnvelope,
  FaMapMarkerAlt,
  FaRocket,
  FaEye,
  FaHeart,
  FaShieldAlt,
} from "react-icons/fa";

const founder = {
  name: "Muhammad Israr ",
  role: "Founder & CEO",
  image: "/israr.jpg",
  bio: "Muhammad Israr is the visionary force behind VoyageX. Hailing from the rugged mountains of Orakzai Agency, he brings the authentic spirit of Pakistan's unexplored frontiers to the travel industry. A bold entrepreneur and tech innovator, he founded VoyageX with a burning mission: to transform how the world discovers Pakistan by connecting travelers with verified local guides and agencies. His journey began at the KUST Incubation Center, where the foundation of VoyageX was laid, and has since grown into a platform reshaping travel technology in Pakistan.",
  skills: ["Visionary Leadership", "Product Strategy", "Travel Tech Innovation", "Business Development"],
  linkedin: "#",
  twitter: "#",
  email: "misrarsultan000@gmail.com",
};
const mentors = [
  {
    name: "Naeem Afridi",
    role: "Technical Mentor",
    title: "Senior Software Engineer",
    image: "https://ui-avatars.com/api/?name=Naeem+Afridi&background=008A1E&color=fff&size=200",
    bio: "Naeem Afridi brings extensive software engineering expertise to the VoyageX team. With years of industry experience in building scalable systems, he guides the technical architecture and engineering decisions at VoyageX, ensuring the platform is built on a solid, future-proof foundation.",
    skills: ["Software Architecture", "System Design", "Engineering Leadership", "Mentorship"],
  },
  {
    name: "Abdur Raheem Afridi",
    role: "Business Mentor",
    title: "MBA — Business Strategy",
    image: "https://ui-avatars.com/api/?name=Abdur+Raheem+Afridi&background=005F14&color=fff&size=200",
    bio: "Abdur Raheem Afridi provides strategic business mentorship to VoyageX. Holding an MBA with a focus on business strategy, he guides the team on market positioning, financial planning, and growth strategy — helping VoyageX navigate the competitive landscape of Pakistan's travel industry.",
    skills: ["Business Strategy", "Market Analysis", "Financial Planning", "Growth Strategy"],
  },
];

const team = [
  {
    name: "Tehseen Ullah",
    role: "Co-Founder",
    image: "https://ui-avatars.com/api/?name=Tehseen+Ullah&background=14532D&color=fff&size=200",
    bio: "Tehseen Ullah co-founded VoyageX alongside Muhammad Israr Sultan. He plays a pivotal role in shaping the company's direction, operations. His dedication drives VoyageX's core mission forward.",
    skills: ["Operations", "Strategy",  "Leadership"],
   
  },
  {
     name: "Syed Ahmad Shah",
    role: "Product Designer",
    image: "https://ui-avatars.com/api/?name=Syed+Ahmad+Shah&background=16A34A&color=fff&size=200",
    bio: "Syed Ahmad Shah crafts the visual identity and user experience of VoyageX. With a keen eye for design and deep understanding of user behavior, he ensures every screen and interaction feels intuitive, beautiful, and purposeful.",
    skills: ["UI/UX Design", "Figma", "User Research", "Prototyping"],
   
  },
  {
    name: "M. Umair",
    role: "Web Developer",
    image: "https://ui-avatars.com/api/?name=M+Umair&background=166534&color=fff&size=200",
    bio: "M. Umair is a core developer at VoyageX, responsible for building and maintaining the platform's frontend and backend systems. He brings technical depth and a problem-solving mindset that keeps VoyageX running smoothly.",
    skills: ["React", "Node.js", "TypeScript", "Database Design"],
  },

  {
     name: "Muhammad Afnan Bakht",
    role: "Digital Marketing Lead",
    image: "https://ui-avatars.com/api/?name=Muhammad+Afnan+Bakht&background=15803D&color=fff&size=200",
    bio: "Muhammad Afnan Bakht leads VoyageX's digital presence and growth strategy. He is responsible for building brand awareness, driving user acquisition, and crafting campaigns that resonate with Pakistan's travel community.",
    skills: ["SEO", "Social Media Marketing", "Content Strategy", "Growth Hacking"],
  },
  {
    name: "Malak Kamran",
    role: "Machine Learning Engineer",
    image: "https://ui-avatars.com/api/?name=Malak+Kamran&background=052E16&color=fff&size=200",
    bio: "Malak Kamran brings artificial intelligence and machine learning capabilities to VoyageX. He works on intelligent features like personalized travel recommendations, smart search, and data-driven insights.",
    skills: ["Machine Learning", "Python", "Data Science", "AI Recommendations"],
  },
];

const values = [
  {
    icon: FaShieldAlt,
    title: "Safety First",
    description: "Every guide and agency on VoyageX goes through a strict verification process. We prioritize the safety of every traveler above everything else.",
  },
  {
    icon: FaHeart,
    title: "Authentic Experiences",
    description: "We believe travel should be genuine. Our local guides offer authentic, immersive experiences that go beyond typical tourist trails.",
  },
  {
    icon: FaRocket,
    title: "Empowering Locals",
    description: "VoyageX creates economic opportunities for local guides and agencies across Pakistan, empowering communities through sustainable tourism.",
  },
  {
    icon: FaEye,
    title: "Transparency",
    description: "Clear pricing, honest reviews, and verified profiles — we build trust between travelers and service providers at every step.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <WhatsAppButton />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-700 to-green-500 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About VoyageX</h1>
          <p className="text-xl md:text-2xl text-green-100 leading-relaxed">
            {"Pakistan's first verified travel marketplace — connecting travelers with trusted local guides and agencies across the country's most breathtaking destinations."}
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {"VoyageX was born out of a simple observation: Pakistan has some of the world's most stunning landscapes — from the towering peaks of Gilgit-Baltistan to the lush valleys of Swat and Chitral — yet travelers struggled to connect with trustworthy local experts who truly knew these places."}
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                {"Founded at the "}
                <span className="text-green-600 font-semibold">
                  {"KUST Incubation Center, Kohat University of Science and Technology"}
                </span>
                {", VoyageX started as an idea to bridge the gap between Pakistan's incredible tourism potential and the travelers eager to explore it safely and authentically."}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {"Today, VoyageX is building Pakistan's most trusted travel ecosystem — where every guide is verified, every agency is accountable, and every journey is memorable."}
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="grid grid-cols-2 gap-6 text-center">
                <div className="p-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">23+</div>
                  <div className="text-gray-600 text-sm">Regions Covered</div>
                </div>
                <div className="p-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
                  <div className="text-gray-600 text-sm">Verified Providers</div>
                </div>
                <div className="p-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">PKR</div>
                  <div className="text-gray-600 text-sm">Local Currency Support</div>
                </div>
                <div className="p-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">2025</div>
                  <div className="text-gray-600 text-sm">Founded</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            {"Mission & Vision"}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <FaRocket className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                {"To make travel across Pakistan safe, accessible, and authentic by connecting travelers with verified local guides and registered agencies — empowering local communities while delivering unforgettable experiences to every visitor."}
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
                <FaEye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                {"To become Pakistan's leading travel marketplace — a trusted platform where every traveler finds their perfect journey and every local expert builds a thriving business, putting Pakistan on the global tourism map."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-center mb-4">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">Meet the Founder</h2>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-shrink-0">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-green-200 shadow-lg">
                  <Image
                    src={founder.image}
                    alt={founder.name}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{founder.name}</h3>
                <p className="text-green-600 font-semibold mb-1">{founder.role}</p>
                <p className="text-gray-500 text-sm mb-4">Kohat, KPK — Pakistan</p>
                <p className="text-gray-600 leading-relaxed mb-6">{founder.bio}</p>
                <div className="flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                  {founder.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4 justify-center md:justify-start">
                  <a href={founder.linkedin} className="text-gray-400 hover:text-green-600 transition-colors">
                    <FaLinkedin className="w-5 h-5" />
                  </a>
                  <a href={founder.twitter} className="text-gray-400 hover:text-green-600 transition-colors">
                    <FaTwitter className="w-5 h-5" />
                  </a>
                  <a href={"mailto:" + founder.email} className="text-gray-400 hover:text-green-600 transition-colors">
                    <FaEnvelope className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mentors Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Our Mentors</h2>
          <p className="text-gray-500 text-center mb-16">Guided by experienced professionals who believe in our vision.</p>
          <div className="grid md:grid-cols-2 gap-8">
            {mentors.map((mentor) => (
              <div
                key={mentor.name}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  <img
                    src={mentor.image}
                    alt={mentor.name}
                    loading="lazy"
                    decoding="async"
                    className="w-20 h-20 rounded-full flex-shrink-0"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{mentor.name}</h3>
                    <p className="text-green-600 font-semibold text-sm mb-1">{mentor.role}</p>
                    <p className="text-gray-500 text-xs mb-3">{mentor.title}</p>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{mentor.bio}</p>
                    <div className="flex flex-wrap gap-2">
                      {mentor.skills.map((skill) => (
                        <span
                          key={skill}
                          className="bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Our Team</h2>
          <p className="text-gray-500 text-center mb-16">The talented people building VoyageX every day.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow text-center"
              >
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  className="w-24 h-24 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-green-600 font-semibold text-sm mb-4">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{member.bio}</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {member.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-white border border-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-green-600 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Explore Pakistan?</h2>
          <p className="text-green-100 text-lg mb-8">
            {"Discover verified guides and agencies across Pakistan's most breathtaking destinations."}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/packages"
              className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-green-50 transition-colors"
            >
              Browse Packages
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}