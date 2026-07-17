import type { Metadata } from "next";
import AboutPage from "./about-client";

export const metadata: Metadata = {
  title: "About VoyageX | Pakistan Tourism Marketplace",
  description:
    "Learn about VoyageX — Pakistan's trusted marketplace connecting travelers with verified local guides and travel agencies across Hunza, Skardu, Swat, Chitral, and beyond.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About VoyageX | Pakistan Tourism Marketplace",
    description:
      "Learn about VoyageX — Pakistan's trusted marketplace connecting travelers with verified local guides and travel agencies.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About VoyageX | Pakistan Tourism Marketplace",
    description:
      "Learn about VoyageX — Pakistan's trusted marketplace connecting travelers with verified local guides and travel agencies.",
  },
};

export default function Page() {
  return <AboutPage />;
}
