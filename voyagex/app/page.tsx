import type { Metadata } from "next";
import AboutSection from "@/components/aboutsection";
import AgenciesSection from "@/components/agenciessection";
import Footer from "@/components/footer";
import GuidesSection from "@/components/guidesection";
import Hero from "@/components/hero";
import PackagesSection from "@/components/package_section";
import TestimonialSection from "@/components/testimonial";
import ExploreSection from "@/components/exploresection";
import "./marquee.css";
import WhatsAppButton from "@/components/whatsappbutton";

export const metadata: Metadata = {
  title: "VoyageX — Pakistan Travel Marketplace | Local Guides & Tour Packages",
  description:
    "VoyageX is Pakistan's tourism marketplace. Book verified local guides and tour packages across Hunza, Skardu, Swat, Chitral, and northern Pakistan.",
  keywords: [
    "VoyageX",
    "VoyageX Travel",
    "Pakistan tourism marketplace",
    "Northern Pakistan guides",
    "Hunza guide",
    "Skardu tour package",
    "local guides Pakistan",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "VoyageX — Pakistan Travel Marketplace",
    description:
      "Book verified local guides and tour packages across northern Pakistan with VoyageX.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VoyageX — Pakistan Travel Marketplace",
    description:
      "Book verified local guides and tour packages across northern Pakistan with VoyageX.",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">

      {/* <div className="bg-green-600 text-white py-2 overflow-hidden w-full">
        <div className="marquee-track text-sm font-medium px-4">
          {"🌍 VoyageX is in early access — Registration is invite-only.   |   To join as a guide or agency, contact us on WhatsApp:   "}
          <a href="https://wa.me/923199052314" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            {"  +92 319 9052314  "}
          </a>
          {"          🌍 VoyageX is in early access — Registration is invite-only.   |   To join as a guide or agency, contact us on WhatsApp:   "}
          <a href="https://wa.me/923199052314" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            {"  +92 319 9052314  "}
          </a>
          {"          🌍 VoyageX is in early access — Registration is invite-only.   |   To join as a guide or agency, contact us on WhatsApp:   "}
          <a href="https://wa.me/923199052314" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            {"  +92 319 9052314  "}
          </a>
          {"          "}
        </div>
      </div>

      <div className="container mx-auto px-4">
      </div> */}

      <Hero />
      <WhatsAppButton />

      <section className="container mx-auto px-4 py-16">
        <ExploreSection />
        <PackagesSection />
        <AgenciesSection />
        <GuidesSection />
        <AboutSection />
        <TestimonialSection />
        <Footer />
      </section>

    </div>
  );
}